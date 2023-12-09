const { WebClient } = require('@slack/web-api');
const { isOffTime } = require("./helpers");
//const PR_CHANNEL = 'CRBDC5H6C'; (acs-schedule-eng)
const PR_CHANNEL = 'C0679N7LHBP'; // (temp-bot-test)
const options = {};
const web = new WebClient(process.env.SLACK_TOKEN, options);
//

function getTomorrowPostTime(){
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let day = tomorrow.getDay();

    while (day >= 5) {
        tomorrow.setDate(tomorrow.getDate() + 1);
        day = tomorrow.getDay();
    }

    tomorrow.setHours(7, 0, 0);
    const t = `${tomorrow.getTime()}`;
    console.log('##### t:', t)
    return Number(t.substring(0, t.length - 3));
}

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
        if (isOffTime()){
            await  web.chat.scheduleMessage({
                channel,
                text: message,
                post_at: getTomorrowPostTime()
            });
        } else{
            await web.chat.postMessage({
                channel,
                thread_ts: messageId,
                text: message
            });
        }

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
        return error;
    }
};

const sendSlackMessageNow = async (message, channel) => {
    const resp = await web.chat.postMessage({
        text: message,
        channel,
    });
    return resp.ts;
}
const sendSlackMessage = async (message) => {
    const channel = process.env.SLACK_CHANNEL_ID || PR_CHANNEL;

    try {
        if (isOffTime()){
            try {
                const result = await web.chat.scheduleMessage({
                    channel,
                    text: message,
                    post_at: getTomorrowPostTime()
                });
                return result.scheduled_message_id;
            } catch (e) {
                console.error('# failed to send schedule message. error message:', e.message);
                console.error('# failed to send schedule message. error data:',JSON.stringify(e.data));
            }
        }

        return await sendSlackMessageNow(message, channel);
    } catch (e) {
        console.error('# error trying to send message:', e.message);
        return e;
    }
};

async function processSlackGetRequest() {
    try {
        const channel = process.env.SLACK_CHANNEL_ID || PR_CHANNEL;
        const result = await web.conversations.history({
            channel,
            inclusive: true,
            limit: 5
        });

        return result.messages;
    } catch (e) {
        console.error('# error trying to get slack history:', e.message)
        return e
    }
}
async function processSlackDeleteRequest(body) {
    if (body.messageId){
        return await deleteSlackMessage(body.messageId)
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
    processSlackGetRequest
}
/*
scheduled_message_id
 */
