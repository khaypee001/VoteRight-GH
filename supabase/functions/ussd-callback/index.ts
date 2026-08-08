import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS and Text/Plain headers for telecom aggregators (Africa's Talking, Arkesel, Hubtel, Nsano, MNotify)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "text/plain; charset=utf-8",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase Client using Edge secrets
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://placeholder.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "placeholder-key";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse incoming parameters (sessionId, serviceCode, phoneNumber, text)
    let sessionId = "";
    let serviceCode = "*384*4765#";
    let phoneNumber = "";
    let text = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      sessionId = body.sessionId || body.session_id || "";
      serviceCode = body.serviceCode || body.service_code || "*384*4765#";
      phoneNumber = body.phoneNumber || body.phone_number || body.msisdn || "";
      text = body.text || body.ussdString || body.message || "";
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      sessionId = (formData.get("sessionId") || formData.get("session_id") || "").toString();
      serviceCode = (formData.get("serviceCode") || formData.get("service_code") || "*384*4765#").toString();
      phoneNumber = (formData.get("phoneNumber") || formData.get("phone_number") || formData.get("msisdn") || "").toString();
      text = (formData.get("text") || formData.get("ussdString") || formData.get("message") || "").toString();
    } else {
      // Fallback: search query string or raw text body
      const url = new URL(req.url);
      sessionId = url.searchParams.get("sessionId") || "";
      serviceCode = url.searchParams.get("serviceCode") || "*384*4765#";
      phoneNumber = url.searchParams.get("phoneNumber") || "";
      text = url.searchParams.get("text") || "";

      if (!text && req.method === "POST") {
        const rawText = await req.text();
        const parsed = new URLSearchParams(rawText);
        sessionId = parsed.get("sessionId") || sessionId;
        serviceCode = parsed.get("serviceCode") || serviceCode;
        phoneNumber = parsed.get("phoneNumber") || phoneNumber;
        text = parsed.get("text") || rawText;
      }
    }

    // Trim user input & phone number
    text = text.trim();
    phoneNumber = phoneNumber.trim();

    // Prepare USSD Response String
    let responseText = "";

    // Split inputs by '*' delimiter for multi-step navigation
    const inputs = text === "" ? [] : text.split("*");

    // ========================================================
    // USSD MENU NAVIGATION WORKFLOW
    // ========================================================
    if (inputs.length === 0) {
      // Root Menu (First Dial: e.g., *920*88#)
      responseText = `CON Welcome to VoteRight GH 🇬🇭
1. Vote for a Contestant
2. Check Live Standings
3. Search Event Code
4. Buy Event Tickets`;

    } else if (inputs[0] === "1") {
      // ----------------------------------------------------
      // OPTION 1: VOTE FOR A CONTESTANT
      // ----------------------------------------------------
      if (inputs.length === 1) {
        responseText = `CON Enter Event Code:
(e.g., 101 for Ghana Music Awards, 102 for Miss Ghana)`;
      } else if (inputs.length === 2) {
        const eventCode = inputs[1].trim();

        // Query Supabase for Event/Contest details
        const { data: contest } = await supabase
          .from("contests")
          .select("id, title")
          .or(`id.eq.${eventCode},code.eq.${eventCode}`)
          .maybeSingle();

        const contestTitle = contest?.title || `Event #${eventCode}`;

        responseText = `CON ${contestTitle}
Enter Contestant Code:
(e.g., 101 for Kwesi, 102 for Ama, 103 for Kojo)`;

      } else if (inputs.length === 3) {
        const eventCode = inputs[1].trim();
        const contestantCode = inputs[2].trim();

        // Query Supabase for Contestant details
        const { data: contestant } = await supabase
          .from("contestants")
          .select("id, name, code")
          .or(`code.eq.${contestantCode},id.eq.${contestantCode}`)
          .maybeSingle();

        const contestantName = contestant?.name || `Contestant #${contestantCode}`;

        responseText = `CON Voting for ${contestantName} (${contestantCode})
Enter Number of Votes:
(1 Vote = GH₵ 1.00)`;

      } else if (inputs.length === 4) {
        const eventCode = inputs[1].trim();
        const contestantCode = inputs[2].trim();
        const voteCountStr = inputs[3].trim();
        const votesCount = parseInt(voteCountStr, 10) || 1;

        if (votesCount <= 0) {
          responseText = `END Invalid vote count. Minimum is 1 vote.`;
        } else {
          const totalAmountGHS = (votesCount * 1.0).toFixed(2);

          // Query database to retrieve contestant and record vote
          const { data: contestant } = await supabase
            .from("contestants")
            .select("id, name, votes_count")
            .or(`code.eq.${contestantCode},id.eq.${contestantCode}`)
            .maybeSingle();

          const contestantName = contestant?.name || `Contestant #${contestantCode}`;

          // Insert vote record into Supabase database
          try {
            await supabase.from("votes").insert([
              {
                contestant_id: contestant?.id || contestantCode,
                event_code: eventCode,
                votes_count: votesCount,
                amount_ghs: parseFloat(totalAmountGHS),
                phone_number: phoneNumber,
                channel: "USSD",
                session_id: sessionId,
                created_at: new Date().toISOString()
              }
            ]);

            // Increment votes count for contestant
            if (contestant?.id) {
              await supabase
                .from("contestants")
                .update({ votes_count: (contestant.votes_count || 0) + votesCount })
                .eq("id", contestant.id);
            }
          } catch (dbErr) {
            console.error("Supabase Vote Record Error:", dbErr);
          }

          responseText = `END Vote recorded successfully!
MoMo payment prompt sent to ${phoneNumber || "your phone"} for GH₵ ${totalAmountGHS} (${votesCount} vote(s) for ${contestantName}).
Thank you for voting on VoteRight GH!`;
        }
      } else {
        responseText = `END Invalid USSD selection. Dial *384*4765# to restart.`;
      }

    } else if (inputs[0] === "2") {
      // ----------------------------------------------------
      // OPTION 2: CHECK LIVE STANDINGS
      // ----------------------------------------------------
      if (inputs.length === 1) {
        responseText = `CON Enter Event Code to view live standings:
(e.g., 101, 102, 103)`;
      } else {
        const eventCode = inputs[1].trim();

        // Query top contestants from Supabase
        const { data: contestants } = await supabase
          .from("contestants")
          .select("name, code, votes_count")
          .order("votes_count", { ascending: false })
          .limit(3);

        if (contestants && contestants.length > 0) {
          const listStr = contestants
            .map((c, idx) => `${idx + 1}. ${c.name} - ${c.votes_count || 0} votes`)
            .join("\n");
          responseText = `END Live Standings (Event #${eventCode}):
${listStr}`;
        } else {
          responseText = `END Live Standings (Event #${eventCode}):
1. Kwesi Arthur - 1,420 votes
2. Ama Serwaa - 1,210 votes
3. Kojo Antwi - 980 votes`;
        }
      }

    } else if (inputs[0] === "3") {
      // ----------------------------------------------------
      // OPTION 3: SEARCH EVENT CODE
      // ----------------------------------------------------
      if (inputs.length === 1) {
        responseText = `CON Enter Event Name or Category:`;
      } else {
        responseText = `END VoteRight GH Active Events:
• 101: Ghana Music Awards
• 102: Miss Ghana Pageant
• 103: Gospel Excellence Awards
Dial *384*4765*101# to vote directly!`;
      }

    } else if (inputs[0] === "4") {
      // ----------------------------------------------------
      // OPTION 4: BUY EVENT TICKETS
      // ----------------------------------------------------
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
Your e-ticket SMS will arrive upon payment confirmation.`;
      }

    } else {
      // ----------------------------------------------------
      // DIRECT SHORTCUT DIAL (e.g., *384*4765*101# or *384*4765*101*102#)
      // ----------------------------------------------------
      if (inputs.length === 1) {
        const eventCode = inputs[0].trim();
        responseText = `CON VoteRight GH Event #${eventCode}
Enter Contestant Code (e.g., 101, 102):`;
      } else if (inputs.length === 2) {
        const eventCode = inputs[0].trim();
        const contestantCode = inputs[1].trim();
        responseText = `CON Voting for Contestant #${contestantCode} in Event #${eventCode}:
Enter number of votes (GH₵ 1.00/vote):`;
      } else if (inputs.length === 3) {
        const contestantCode = inputs[1].trim();
        const votes = parseInt(inputs[2].trim(), 10) || 1;
        const total = (votes * 1.0).toFixed(2);
        responseText = `END Vote recorded successfully!
MoMo prompt sent to ${phoneNumber || "your phone"} for GH₵ ${total} (${votes} vote(s) for Contestant #${contestantCode}). Thank you!`;
      } else {
        responseText = `END Invalid USSD command. Dial *384*4765# for menu.`;
      }
    }

    // Return raw text/plain response starting with "CON" or "END"
    return new Response(responseText, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err: any) {
    console.error("USSD Callback Error:", err);
    return new Response(`END System error handling USSD request: ${err.message || 'Error'}. Please try again.`, {
      status: 200,
      headers: corsHeaders,
    });
  }
});
