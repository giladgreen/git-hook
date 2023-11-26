const { WebClient } = require('@slack/web-api');
const PR_CHANNEL = 'acs-schedule-eng'
const options = {};
const web = new WebClient(process.env.SLACK_TOKEN, options);

const sendSlackMessage = async (message, c = null) => {
    const channel = c || process.env.SLACK_CHANNEL_ID || PR_CHANNEL;

    try {
        await web.conversations.join({
            channel: channel,
        });
    } catch (e) {
        console.error('# error trying to join channel:', e.message)
    }

    return new Promise(async (resolve, reject) => {

        try {
            const resp = await web.chat.postMessage({
                blocks: message,
                channel: channelId,
            });
            return resolve(resp);
        } catch (error) {
            return resolve(error.message);
        }
    });
};

module.exports = {
    sendSlackMessage
}
