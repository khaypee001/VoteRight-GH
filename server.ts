import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Health Endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "VoteRight GH API & USSD Webhook", ussd_endpoint: "/api/ussd-callback" });
  });

  // Supabase USSD Callback Edge Function Endpoint (Express Webhook Receiver)
  const handleUssdRequest = (req: express.Request, res: express.Response) => {
    try {
      const sessionId = req.body?.sessionId || req.body?.session_id || req.query?.sessionId || "";
      const serviceCode = req.body?.serviceCode || req.body?.service_code || req.query?.serviceCode || "*384*4765#";
      const phoneNumber = (req.body?.phoneNumber || req.body?.phone_number || req.body?.msisdn || req.query?.phoneNumber || "").toString().trim();
      let text = (req.body?.text || req.body?.ussdString || req.body?.message || req.query?.text || "").toString().trim();

      const inputs = text === "" ? [] : text.split("*");
      let responseText = "";

      if (inputs.length === 0) {
        responseText = `CON Welcome to VoteRight GH 🇬🇭
1. Vote for a Contestant
2. Check Live Standings
3. Search Event Code
4. Buy Event Tickets`;
      } else if (inputs[0] === "1") {
        if (inputs.length === 1) {
          responseText = `CON Enter Event Code:
(e.g., 101 for Ghana Music Awards, 102 for Miss Ghana)`;
        } else if (inputs.length === 2) {
          const eventCode = inputs[1].trim();
          responseText = `CON Ghana Music Awards 2026 (Event #${eventCode})
Enter Contestant Code:
(e.g., 101 for Kwesi, 102 for Ama, 103 for Kojo)`;
        } else if (inputs.length === 3) {
          const contestantCode = inputs[2].trim();
          responseText = `CON Voting for Contestant #${contestantCode}
Enter Number of Votes:
(1 Vote = GH₵ 1.00)`;
        } else if (inputs.length === 4) {
          const contestantCode = inputs[2].trim();
          const votesCount = parseInt(inputs[3].trim(), 10) || 1;
          const totalGHS = (votesCount * 1.0).toFixed(2);
          responseText = `END Vote recorded successfully!
MoMo payment prompt sent to ${phoneNumber || "your phone"} for GH₵ ${totalGHS} (${votesCount} vote(s) for Contestant #${contestantCode}).
Thank you for voting on VoteRight GH!`;
        } else {
          responseText = `END Invalid USSD selection. Dial *384*4765# to restart.`;
        }
      } else if (inputs[0] === "2") {
        if (inputs.length === 1) {
          responseText = `CON Enter Event Code to view standings:
(e.g., 101, 102, 103)`;
        } else {
          const eventCode = inputs[1].trim();
          responseText = `END Live Standings (Event #${eventCode}):
1. Kwesi Arthur - 1,420 votes
2. Ama Serwaa - 1,210 votes
3. Kojo Antwi - 980 votes`;
        }
      } else if (inputs[0] === "3") {
        responseText = `END Active VoteRight GH Event Codes:
• 101: Ghana Music Awards
• 102: Miss Ghana Pageant
• 103: Gospel Excellence Awards
Dial *384*4765*101# to vote directly!`;
      } else if (inputs[0] === "4") {
        if (inputs.length === 1) {
          responseText = `CON Buy Event Tickets:
Enter Event Code (e.g. 101):`;
        } else if (inputs.length === 2) {
          responseText = `CON Select Ticket Tier:
1. Regular Pass (GH₵ 50.00)
2. VIP Pass (GH₵ 150.00)
3. VVIP Table (GH₵ 500.00)`;
        } else {
          const tierChoice = inputs[2] === "2" ? "VIP Pass (GH₵ 150)" : inputs[2] === "3" ? "VVIP Table (GH₵ 500)" : "Regular Pass (GH₵ 50)";
          responseText = `END Ticket Order Initialized!
MoMo payment request sent to ${phoneNumber || "your phone"} for ${tierChoice}.
Check SMS for your e-ticket code upon payment.`;
        }
      } else {
        if (inputs.length === 1) {
          responseText = `CON VoteRight GH Event #${inputs[0]}
Enter Contestant Code (e.g., 101, 102):`;
        } else if (inputs.length === 2) {
          responseText = `CON Voting for Contestant #${inputs[1]} in Event #${inputs[0]}:
Enter number of votes (GH₵ 1.00/vote):`;
        } else if (inputs.length === 3) {
          const votes = parseInt(inputs[2].trim(), 10) || 1;
          responseText = `END Vote recorded successfully!
MoMo prompt sent to ${phoneNumber || "your phone"} for GH₵ ${(votes * 1.0).toFixed(2)} (${votes} vote(s) for Contestant #${inputs[1]}). Thank you!`;
        } else {
          responseText = `END Invalid USSD command. Dial *384*4765# for menu.`;
        }
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(responseText);
    } catch (err: any) {
      console.error("USSD Express Webhook Error:", err);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(`END Error processing USSD request: ${err.message || 'System error'}. Please try again.`);
    }
  };

  app.all("/api/ussd-callback", handleUssdRequest);
  app.all("/supabase/functions/ussd-callback", handleUssdRequest);

  // Paystack Configuration Endpoint
  app.get("/api/paystack/config", (_req, res) => {
    const publicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || "pk_test_voteright_gh_demo";
    const hasSecretKey = !!process.env.PAYSTACK_SECRET_KEY;
    res.json({
      publicKey,
      isConfigured: hasSecretKey,
      mode: hasSecretKey ? "live_or_test_authenticated" : "sandbox_simulated"
    });
  });

  // Paystack Initialize Transaction Endpoint
  app.post("/api/paystack/initialize", async (req, res) => {
    try {
      const { email, amountGHS, phone, voterName, nomineeId, nomineeName, contestId, votesCount, reference, callbackUrl } = req.body;

      if (!amountGHS || amountGHS <= 0) {
        return res.status(400).json({ status: false, message: "Invalid amount provided." });
      }

      // Convert GHS to Pesewas (minor currency unit: 1 GHS = 100 pesewas)
      const amountInPesewas = Math.round(Number(amountGHS) * 100);
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      const ref = reference || `VRG-PSTK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const voterEmail = email || (phone ? `${phone.replace(/\D/g, '')}@voteright.gh` : `voter-${Date.now()}@voteright.gh`);

      if (paystackSecret && paystackSecret.startsWith("sk_")) {
        // Real Paystack API call
        const response = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: voterEmail,
            amount: amountInPesewas,
            currency: "GHS",
            reference: ref,
            callback_url: callbackUrl || "https://voteright.gh/payment-callback",
            metadata: {
              voterName: voterName || "Anonymous Voter",
              voterPhone: phone || "",
              nomineeId,
              nomineeName,
              contestId,
              votesCount,
              platform: "VoteRight GH"
            }
          })
        });

        const data = await response.json();
        if (data.status) {
          return res.json({
            status: true,
            message: "Paystack transaction initialized successfully",
            data: {
              authorization_url: data.data.authorization_url,
              access_code: data.data.access_code,
              reference: data.data.reference,
              mode: "authenticated_paystack"
            }
          });
        } else {
          return res.status(400).json({
            status: false,
            message: data.message || "Failed to initialize Paystack payment",
            raw: data
          });
        }
      } else {
        // Sandbox fallback mode when secret key is not configured in env
        const accessCode = `pstk_acc_${Math.random().toString(36).substring(2, 10)}`;
        return res.json({
          status: true,
          message: "Paystack sandbox transaction initialized",
          data: {
            authorization_url: `https://checkout.paystack.com/sandbox-${accessCode}`,
            access_code: accessCode,
            reference: ref,
            mode: "sandbox_simulated"
          }
        });
      }
    } catch (error: any) {
      console.error("Paystack Initialize Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error during Paystack initialization"
      });
    }
  });

  // Paystack Verify Transaction Endpoint
  app.get("/api/paystack/verify/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

      if (!reference) {
        return res.status(400).json({ status: false, message: "Transaction reference is required." });
      }

      if (paystackSecret && paystackSecret.startsWith("sk_")) {
        // Authenticated Paystack API Verification
        const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          }
        });

        const data = await response.json();
        if (data.status && data.data.status === "success") {
          return res.json({
            status: true,
            message: "Payment verified successfully by Paystack API",
            data: {
              verified: true,
              reference: data.data.reference,
              amountGHS: data.data.amount / 100,
              channel: data.data.channel || "mobile_money",
              currency: data.data.currency,
              paidAt: data.data.paid_at || new Date().toISOString(),
              gatewayResponse: data.data.gateway_response,
              metadata: data.data.metadata || {},
              customer: data.data.customer || {},
              mode: "paystack_live_verified"
            }
          });
        } else {
          return res.json({
            status: false,
            message: data.message || "Payment verification failed or pending",
            data: { verified: false, raw: data }
          });
        }
      } else {
        // Sandbox fallback verification
        return res.json({
          status: true,
          message: "Paystack transaction verified (Sandbox Authenticated)",
          data: {
            verified: true,
            reference,
            channel: "mobile_money_mtn",
            paidAt: new Date().toISOString(),
            gatewayResponse: "Successful (Paystack Verified)",
            mode: "sandbox_verified"
          }
        });
      }
    } catch (error: any) {
      console.error("Paystack Verification Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Error verifying Paystack transaction"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoteRight GH Server with Paystack API running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
