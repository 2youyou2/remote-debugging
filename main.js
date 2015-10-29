// require('./core');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'remote-debugging:open': function () {
      Editor.Panel.open('remote-debugging.panel');
    }
};
