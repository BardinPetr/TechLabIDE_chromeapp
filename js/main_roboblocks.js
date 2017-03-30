if (window.roboblocksLanguage === undefined ||
    window.roboblocksLanguage == null) {
    var roboblocksLanguage = 'ru';
}

RoboBlocks.load({
    zoom: 0.5
});

var el = document.getElementById('blockly');
Blockly.inject(el, {
    toolbox: Blockly.createToolbox()
});

Blockly.Xml.domToWorkspace(Blockly.getMainWorkspace(),
    document.getElementById('startBlocks'));

//$('.blocklySvg, #blockly').height('150%');
//$('.blocklySvg').width('100%');

var colors = [
    "",
    RoboBlocks.LANG_COLOUR_VARIABLES,
    RoboBlocks.LANG_COLOUR_LOGIC,
    RoboBlocks.LANG_COLOUR_CONTROL,
    RoboBlocks.LANG_COLOUR_ADVANCED,
    RoboBlocks.LANG_COLOUR_PROCEDURES,
    RoboBlocks.LANG_COLOUR_MATH,
    RoboBlocks.LANG_COLOUR_COMMUNICATION,
    RoboBlocks.LANG_COLOUR_LCD,
    RoboBlocks.LANG_COLOUR_SERVO,
    RoboBlocks.LANG_COLOUR_TEXT,
    RoboBlocks.LANG_COLOUR_BQ,
    RoboBlocks.LANG_COLOUR_ZUM,
];
$('.blocklyTreeRow').each(function(i, e) {
    $(e).prepend('<span class="treeLabelBlock" style="background-color:' + colors[i] + '"></span>');
});

Blockly.addChangeListener(function() {
    $('#code').html('<code class="c++"><pre>' +
        escapeCode(Blockly.Arduino.workspaceToCode()) +
        '</pre></code>');

    $("pre").each(function(i, e) {
        hljs.highlightBlock(e);
    });
});

function toogleCode() {
    if ($('#code').css('display') == 'none') {
        $('#code').show();
        $('#blockly').width('66%');
    } else {
        $('#code').hide();
        $('#blockly').width('100%');
    }
    Blockly.fireUiEvent(window, "resize");
}


function escapeCode(code) {
    var str = code;
    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
    return str;
}

function resetWorkspace() {
    Blockly.mainWorkspace.clear();
    Blockly.Xml.domToWorkspace(Blockly.getMainWorkspace(),
        document.getElementById('startBlocks'));
}

function get_code() {
    return escapeCode(Blockly.Arduino.workspaceToCode());
}

function get_xml() {
    var xml = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
    var data = Blockly.Xml.domToText(xml);
    return data;
}

function set_xml(data) {
    resetWorkspace();
    var xml = Blockly.Xml.textToDom(data);
    Blockly.Xml.domToWorkspace(Blockly.getMainWorkspace(), xml);
}