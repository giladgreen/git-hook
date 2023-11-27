const { WebClient } = require('@slack/web-api');
//const PR_CHANNEL = 'CRBDC5H6C'; (acs-schedule-eng)
const PR_CHANNEL = 'C0679N7LHBP'; // (temp-bot-test)
const options = {};
const web = new WebClient(process.env.SLACK_TOKEN, options);
//
const replayToSlackMessage = async (messageId, message,  c = null) => {
    const channel = c || process.env.SLACK_CHANNEL_ID || PR_CHANNEL;
    try {
        await web.chat.postMessage({
            channel,
            thread_ts: messageId,
            text: message
            // You could also use a blocks[] array to send richer content
        });
    } catch (e) {
        console.error('# error trying to reply message:', e.message)
    }
}
const reactToSlackMessage = async (messageId, reaction,  c = null) => {
    const channel = c || process.env.SLACK_CHANNEL_ID || PR_CHANNEL;
    try {
        await web.reactions.add({
            channel,
            ts: messageId,
            timestamp: messageId,
            name: reaction
        });
    } catch (e) {
        console.error('# error trying to reply message:', e.message)
    }
}
const deleteSlackMessage = async (messageId, c = null) => {
    const channel = c || process.env.SLACK_CHANNEL_ID || PR_CHANNEL;

    try {
        await web.chat.delete({
            channel,
            ts: messageId
        });
        console.log('# after delete message:')

    } catch (e) {
        console.error('# error trying to delete message:', e.message)
    }
};

const sendSlackMessage = async (message, c = null) => {
    const channel = c || process.env.SLACK_CHANNEL_ID || PR_CHANNEL;

    try {
        console.log('# before try to send message: ', message,' to channel:', channel)

        const resp = await web.chat.postMessage({
            text: message,
            channel,
        });
        console.log('# after send message, response:', resp)

        return resp.ts;
    } catch (e) {
        console.error('# error trying to join channel/send message:', e.message)
    }
};

module.exports = {
    sendSlackMessage,
    deleteSlackMessage,
    replayToSlackMessage,
    reactToSlackMessage
}
