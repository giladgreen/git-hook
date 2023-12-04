const { WebClient } = require('@slack/web-api');
//const PR_CHANNEL = 'CRBDC5H6C'; (acs-schedule-eng)
const PR_CHANNEL = 'C0679N7LHBP'; // (temp-bot-test)
const options = {};
const web = new WebClient(process.env.SLACK_TOKEN, options);
//
const updateSlackMessage = async (messageId, message) => {
    const channel = process.env.SLACK_CHANNEL_ID || PR_CHANNEL;
    try {
        await web.chat.update({
            channel,
            ts: messageId,
            text: message
            // You could also use a blocks[] array to send richer content
        });
    } catch (e) {
        console.error('# error trying to update message:', e.message,' message',message)
    }
}
const replayToSlackMessage = async (messageId, message) => {
    const channel = process.env.SLACK_CHANNEL_ID || PR_CHANNEL;
    try {
        await web.chat.postMessage({
            channel,
            thread_ts: messageId,
            text: message
            // You could also use a blocks[] array to send richer content
        });
    } catch (e) {
        console.error('# error trying to reply to a message:', e.message, 'message',message)
    }
}
const reactToSlackMessage = async (messageId, reaction) => {
    const channel = process.env.SLACK_CHANNEL_ID || PR_CHANNEL;
    try {
        await web.reactions.add({
            channel,
            ts: messageId,
            timestamp: messageId,
            name: reaction
        });
    } catch (e) {
        console.error('# error trying to react to a message:', e.message, 'messageId:',messageId,'reaction', reaction)
    }
}
const removeReactToSlackMessage = async (messageId, reaction) => {
    const channel = process.env.SLACK_CHANNEL_ID || PR_CHANNEL;
    try {
        await web.reactions.remove({
            channel,
            ts: messageId,
            timestamp: messageId,
            name: reaction
        });
    } catch (e) {
        console.error('# error trying to remove message reaction:', e.message, 'messageId:',messageId,'reaction', reaction)
    }
}
const deleteSlackMessage = async (messageId) => {
    const channel = process.env.SLACK_CHANNEL_ID || PR_CHANNEL;

    try {
        await web.chat.delete({
            channel,
            ts: messageId
        });
    } catch (e) {
        console.error('# error trying to delete message:', e.message, ' messageId',messageId)
    }
};

const sendSlackMessage = async (message) => {
    const channel = process.env.SLACK_CHANNEL_ID || PR_CHANNEL;

    try {
        const resp = await web.chat.postMessage({
            text: message,
            channel,
        });
        return resp.ts;
    } catch (e) {
        console.error('# error trying to send message:', e.message, 'message')
    }
};

module.exports = {
    sendSlackMessage,
    deleteSlackMessage,
    replayToSlackMessage,
    reactToSlackMessage,
    updateSlackMessage,
    removeReactToSlackMessage
}
