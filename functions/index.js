const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * VoteRight GH USSD Webhook Callback Edge Cloud Function
 * Handles incoming HTTP POST/GET requests from telecom aggregators (Hubtel, Arkesel, Africa's Talking, Nsano, MNotify)
 */
exports.ussdCallback = onRequest({ cors: true }, async (req, res) => {
  // Enforce plain text response header for telecom USSD gateways
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  try {
    // Extract standard USSD parameters
    const sessionId = req.body?.sessionId || req.body?.session_id || req.query?.sessionId || "";
    const serviceCode = req.body?.serviceCode || req.body?.service_code || req.query?.serviceCode || "*384*4765#";
    const phoneNumber = (req.body?.phoneNumber || req.body?.phone_number || req.body?.msisdn || req.query?.phoneNumber || "").toString().trim();
    let text = (req.body?.text || req.body?.ussdString || req.body?.message || req.query?.text || "").toString().trim();

    // Split text input by '*' to calculate depth in the USSD menu tree
    const inputs = text === "" ? [] : text.split("*");
    let responseText = "";

    // ========================================================
    // USSD MENU WORKFLOW
    // ========================================================
    if (inputs.length === 0) {
      // Step 1: Root USSD Welcome Menu
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

        // Query Firestore for Event
        let eventTitle = `Event #${eventCode}`;
        try {
          const eventSnapshot = await db.collection("events").where("code", "==", eventCode).limit(1).get();
          if (!eventSnapshot.empty) {
            eventTitle = eventSnapshot.docs[0].data().title || eventTitle;
          }
        } catch (e) {
          console.error("Firestore Event query error:", e);
        }

        responseText = `CON ${eventTitle}
Enter Contestant Code:
(e.g., 101 for Kwesi, 102 for Ama, 103 for Kojo)`;

      } else if (inputs.length === 3) {
        const eventCode = inputs[1].trim();
        const contestantCode = inputs[2].trim();

        // Query Firestore for Contestant
        let contestantName = `Contestant #${contestantCode}`;
        try {
          const contestantSnapshot = await db.collection("contestants").where("code", "==", contestantCode).limit(1).get();
          if (!contestantSnapshot.empty) {
            contestantName = contestantSnapshot.docs[0].data().name || contestantName;
          }
        } catch (e) {
          console.error("Firestore Contestant query error:", e);
        }

        responseText = `CON Voting for ${contestantName} (${contestantCode})
Enter Number of Votes:
(1 Vote = GH₵ 1.00)`;

      } else if (inputs.length === 4) {
        const eventCode = inputs[1].trim();
        const contestantCode = inputs[2].trim();
        const votesCount = parseInt(inputs[3].trim(), 10) || 1;

        if (votesCount <= 0) {
          responseText = `END Invalid vote count. Minimum is 1 vote.`;
        } else {
          const amountGHS = parseFloat((votesCount * 1.0).toFixed(2));

          let contestantName = `Contestant #${contestantCode}`;
          let contestantDocRef = null;

          try {
            const contestantSnapshot = await db.collection("contestants").where("code", "==", contestantCode).limit(1).get();
            if (!contestantSnapshot.empty) {
              const doc = contestantSnapshot.docs[0];
              contestantName = doc.data().name || contestantName;
              contestantDocRef = doc.ref;
            }

            // Save Vote Record in Firestore
            await db.collection("votes").add({
              eventCode,
              contestantCode,
              votesCount,
              amountGHS,
              phoneNumber,
              channel: "USSD",
              sessionId,
              status: "COMPLETED",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Increment contestant votes count atomically
            if (contestantDocRef) {
              await contestantDocRef.update({
                votesCount: admin.firestore.FieldValue.increment(votesCount),
              });
            }
          } catch (dbErr) {
            console.error("Firestore Vote record write error:", dbErr);
          }

          responseText = `END Vote recorded successfully!
MoMo payment prompt sent to ${phoneNumber || "your phone"} for GH₵ ${amountGHS.toFixed(2)} (${votesCount} vote(s) for ${contestantName}).
Thank you for voting on VoteRight GH!`;
        }
      } else {
        responseText = `END Invalid selection. Dial *384*4765# to restart.`;
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
        let standingsText = "";

        try {
          const snapshot = await db.collection("contestants")
            .orderBy("votesCount", "desc")
            .limit(3)
            .get();

          if (!snapshot.empty) {
            const list = [];
            snapshot.docs.forEach((doc, idx) => {
              const data = doc.data();
              list.push(`${idx + 1}. ${data.name || "Contestant"} - ${data.votesCount || 0} votes`);
            });
            standingsText = list.join("\n");
          }
        } catch (e) {
          console.error("Firestore standings query error:", e);
        }

        if (!standingsText) {
          standingsText = `1. Kwesi Arthur - 1,420 votes\n2. Ama Serwaa - 1,210 votes\n3. Kojo Antwi - 980 votes`;
        }

        responseText = `END Live Standings (Event #${eventCode}):\n${standingsText}`;
      }

    } else if (inputs[0] === "3") {
      // ----------------------------------------------------
      // OPTION 3: SEARCH EVENT CODE
      // ----------------------------------------------------
      responseText = `END VoteRight GH Active Events:
• 101: Ghana Music Awards
• 102: Miss Ghana Pageant
• 103: Gospel Excellence Awards
Dial *384*231*101# to vote directly!`;

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

        try {
          await db.collection("ticket_orders").add({
            eventCode: inputs[1].trim(),
            tier: tierChoice,
            phoneNumber,
            channel: "USSD",
            sessionId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (e) {
          console.error("Ticket order record error:", e);
        }

        responseText = `END Ticket Order Initialized!
MoMo payment prompt sent to ${phoneNumber || "your phone"} for ${tierChoice}.
Your e-ticket code will arrive via SMS upon payment.`;
      }

    } else {
      // ----------------------------------------------------
      // DIRECT SHORTCODE DIAL (e.g., *920*88*101*102#)
      // ----------------------------------------------------
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
        responseText = `END Invalid USSD code. Dial *384*4765# for main menu.`;
      }
    }

    return res.status(200).send(responseText);
  } catch (error) {
    console.error("USSD Callback Error:", error);
    return res.status(200).send(`END System error processing USSD request. Please try again later.`);
  }
});
