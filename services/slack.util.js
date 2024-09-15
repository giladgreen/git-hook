const { WebClient } = require('@slack/web-api');
const PR_CHANNEL = 'C0679N7LHBP';
const NOTIFICATION_CHANNEL = 'C06SE2Z5GUE'; // (temp-bot-test)
const BE_CHANNEL = 'C07LW4DGW3F';
const FE_CHANNEL = 'C07M1D6AKGC';
const options = {};
const web = new WebClient(process.env.SLACK_TOKEN, options);

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
        console.error('# error trying to update message:', e.message,' message',message);
        return e;
    }
}
const replayToSlackMessage = async (messageId, message) => {
    const channel = process.env.SLACK_CHANNEL_ID || PR_CHANNEL;
    try {
        await web.chat.postMessage({
            channel,
            thread_ts: messageId,
            text: message
        });

    } catch (e) {
        console.error('# error trying to reply to a message:', e.message, 'message',message);
        return e;
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
        console.error('# error trying to react to a message:', e.message, 'messageId:',messageId,'reaction', reaction);
        return e;
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
        console.error('# error trying to remove message reaction:', e.message, 'messageId:',messageId,'reaction', reaction);
        console.error('# error: ', e.message);
        return e;
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
        return e;
    }
};

const sendSlackMessageNow = async (message, channel) => {
    const resp = await web.chat.postMessage({
        text: message,
        channel,
    });
    // console.log('## sendSlackMessageNow resp', resp)
    return resp.ts;
}
const sendSlackMessage = async (message, isServerChannel) => {
    const channel = isServerChannel ? BE_CHANNEL : FE_CHANNEL;

    try {
        const messageId = await sendSlackMessageNow(message, channel);

        return messageId;

    } catch (e) {
        console.error('# error trying to send message:', e.message);
        return e;
    }
};

const sendSlackNotification = async (isServerChannel, message) => {
    const channel = isServerChannel ? BE_CHANNEL : FE_CHANNEL;

    try {
        const messageId = await sendSlackMessageNow(message, channel);

        return messageId;

    } catch (e) {
        console.error('# error trying to send message:', e.message);
        return e;
    }
};

async function processSlackGetRequest() {
    return {
        msg: "this API currently does not work"
    }
}
async function processSlackDeleteRequest(body) {
    if (body.messageId){
        const messageId = body.messageId.indexOf('p') === 0 ? `${body.messageId.substr(1, 10)}.${body.messageId.substr(11)}` : body.messageId;

        return await deleteSlackMessage(messageId)
    }
}
module.exports = {
    sendSlackMessage,
    deleteSlackMessage,
    replayToSlackMessage,
    reactToSlackMessage,
    updateSlackMessage,
    removeReactToSlackMessage,
    processSlackDeleteRequest,
    processSlackGetRequest,
    sendSlackNotification
}
