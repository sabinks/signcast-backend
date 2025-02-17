import express from 'express'
// import { pairingCodes } from '..';

const router = express.Router()

// // Generate a new pairing code
// router.get("/generate-code", async (req, res) => {
//     const code = nanoid(6); // Generate 6-character code
//     pairingCodes[code] = { paired: false, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 min expiry
//     const qrCodeUrl = await QRCode.toDataURL(`pairing:${code}`);
//     res.json({ code, qrCodeUrl });
// });

// // Validate pairing code
// router.post("/pair-device/:code", (req, res) => {
//     const { code } = req.params;
//     if (pairingCodes[code] && !pairingCodes[code].paired) {
//         pairingCodes[code].paired = true;
//         wss.clients.forEach((client) => client.send(JSON.stringify({ event: "paired", code })));
//         return res.json({ success: true, message: "Device paired successfully!" });
//     }
//     res.status(400).json({ success: false, message: "Invalid or expired code." });
// });

// // Clean expired codes
// setInterval(() => {
//     const now = Date.now();
//     Object.keys(pairingCodes).forEach((code) => {
//         if (pairingCodes[code].expiresAt < now) delete pairingCodes[code];
//     });
// }, 60 * 1000); // Run every minute

export default router;