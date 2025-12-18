const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

/**
 * Trigger: When a new booking is created.
 * Goal: Notify the Tutor (Service Provider).
 */
exports.onBookingCreated = onDocumentCreated("bookings/{bookingId}", async (event) => {
    const booking = event.data.data();
    if (!booking) return;

    const tutorId = booking.tutorId;

    // Fetch tutor's FCM token
    const userSnap = await db.collection("users").doc(tutorId).get();
    const userData = userSnap.data();

    if (userData && userData.fcmToken) {
        const message = {
            token: userData.fcmToken,
            notification: {
                title: "New Service Request! 🚀",
                body: `You have a new request for ${booking.subject || 'Service'}. Check it out!`
            },
            data: {
                bookingId: event.params.bookingId,
                type: "booking_request"
            }
        };

        try {
            await getMessaging().send(message);
            console.log("Notification sent to tutor:", tutorId);
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    }
});

/**
 * Trigger: When a booking status changes.
 * Goal: Notify the Student.
 */
exports.onBookingStatusChanged = onDocumentUpdated("bookings/{bookingId}", async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();

    if (newData.status === oldData.status) return; // No status change

    const studentId = newData.studentId;
    const status = newData.status;

    let title = "Booking Update";
    let body = `Your booking status has changed to ${status}.`;

    if (status === 'confirmed') {
        title = "Booking Confirmed! ✅";
        body = "Your service provider has accepted your request.";
    } else if (status === 'in_progress') {
        title = "Job Started 🛠️";
        body = "Your service has started!";
    } else if (status === 'completed') {
        title = "Job Completed 🎉";
        body = "Service is done! Please review and pay.";
    } else if (status === 'cancelled') {
        title = "Booking Cancelled ❌";
        body = "Your booking was cancelled.";
    }

    // Fetch student's FCM token
    const userSnap = await db.collection("users").doc(studentId).get();
    const userData = userSnap.data();

    if (userData && userData.fcmToken) {
        const message = {
            token: userData.fcmToken,
            notification: {
                title: title,
                body: body
            },
            data: {
                bookingId: event.params.bookingId,
                type: "booking_update"
            }
        };

        try {
            await getMessaging().send(message);
            console.log("Notification sent to student:", studentId);
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    }
});

/**
 * Trigger: When a new message is sent.
 * Goal: Notify the recipient.
 */
exports.onMessageCreated = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event) => {
    const messageData = event.data.data();
    const chatId = event.params.chatId;

    if (!messageData) return;

    // Get the chat document to find participants
    const chatSnap = await db.collection("chats").doc(chatId).get();
    const chatData = chatSnap.data();

    if (!chatData) return;

    // Identify recipient (the one who didn't send the message)
    const recipientId = chatData.participants.find(uid => uid !== messageData.senderId);

    if (recipientId) {
        const userSnap = await db.collection("users").doc(recipientId).get();
        const userData = userSnap.data();

        if (userData && userData.fcmToken) {
            const payload = {
                token: userData.fcmToken,
                notification: {
                    title: "New Message 💬",
                    body: messageData.text || "You received a new image."
                },
                data: {
                    chatId: chatId,
                    type: "chat_message"
                }
            };

            try {
                await getMessaging().send(payload);
                console.log("Message notification sent to:", recipientId);
            } catch (error) {
                console.error("Error sending message notification:", error);
            }
        }
    }
});
