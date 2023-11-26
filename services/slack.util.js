const { WebClient } = require('@slack/web-api');
const PR_CHANNEL = 'acs-schedule-eng'
const options = {};
const web = new WebClient(process.env.SLACK_TOKEN, options);

const sendSlackMessage = async (message, c = null) => {
    const channel = c || process.env.SLACK_CHANNEL_ID || PR_CHANNEL;

    try {
        console.log('# try to  join channel:', channel)
        await web.conversations.join({
            channel: channel,
        });
        console.log('# after try to  join channel:', channel)
        console.log('# before try to send message: ', message,' to channel:', channel)

        const resp = await web.chat.postMessage({
            blocks: message,
            channel: channelId,
        });
        console.log('# after send message, response:', resp)

        return;
    } catch (e) {
        console.error('# error trying to join channel/send message:', e.message)
    }
};

module.exports = {
    sendSlackMessage
}
