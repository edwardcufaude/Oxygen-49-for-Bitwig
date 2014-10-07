loadAPI(1);

host.defineController("M-Audio", "Oxygen 49", "1.0", "7aa3c000-f93d-11e3-a3ac-0800200c9a66");
host.defineMidiPorts(1, 0);

var CC =
{
	PREV_TRACK : 110,
	NEXT_TRACK : 111,
	LOOP       : 113,
	REWIND     : 114,
	FORWARD    : 115,
	STOP       : 116,
	PLAY       : 117,
	RECORD     : 118,
	SLIDER     : 74,
};

var LOWEST_CC = 2;
var HIGHEST_CC = 119;

var DEVICE_START_CC = 75;
var DEVICE_END_CC = 103;

function init()
{
	transport = host.createTransport();
	host.getMidiInPort(0).createNoteInput("Oxygen 49");
	host.getMidiInPort(0).setMidiCallback(onMidi);

	// Map CC 20 - 27 to device parameters

	cursorDevice = host.createCursorDeviceSection(8);
	cursorTrack = host.createCursorTrackSection(3, 0);
	primaryInstrument = cursorTrack.getPrimaryInstrument();

	for ( var i = 0; i < 8; i++)
	{
		var p = primaryInstrument.getMacro(i).getAmount();
		p.setIndication(true);
	}

	// Make the rest freely mappable
	userControls = host.createUserControlsSection(HIGHEST_CC - LOWEST_CC + 1 - 8);

	for ( var i = LOWEST_CC; i < HIGHEST_CC; i++)
	{
		if (!isInDeviceParametersRange(i))
		{
			var index = userIndexFromCC(i);
			userControls.getControl(index).setLabel("CC" + i);
		}
	}
}

function exit()
{
}

function isInDeviceParametersRange(cc)
{
	return cc == 75 || cc == 76 || cc == 77 || cc == 78 || cc == 79 || cc == 92 || cc == 95 || cc == 10;
}

function userIndexFromCC(cc)
{
	if (cc == 75 || cc == 76 || cc == 77 || cc == 78 || cc == 79)
	{
		return cc - LOWEST_CC - 8;
	}else if (cc == 95 || cc == 92 || cc == 10)
	{
			return cc - LOWEST_CC - 1;
	}
	return cc - LOWEST_CC;
}

function onMidi(status, data1, data2)
{
	if (isChannelController(status))
	{
		if (isInDeviceParametersRange(data1))
		{
			if (data1 == 75) { var index = 0}
			if (data1 == 76) { var index = 1}
			if (data1 == 92) { var index = 2}
			if (data1 == 95) { var index = 3}
			if (data1 == 10) { var index = 4}
			if (data1 == 77) { var index = 5}
			if (data1 == 78) { var index = 6}
			if (data1 == 79) { var index = 7}
			
			primaryInstrument.getMacro(index).getAmount().set(data2, 128);
		}
				// Handle transport-buttons and trackselection
		else if ((data1 >= CC.PREV_TRACK && data1 <= CC.RECORD && data1 != 112) && data2 > 0)
		{
			switch(data1) {
				case CC.PREV_TRACK:
				cursorTrack.selectPrevious();
				break;
			case CC.NEXT_TRACK:
				cursorTrack.selectNext();
				break;
			case CC.LOOP:
				transport.toggleLoop();
				break;
			case CC.REWIND:
				transport.rewind();
				break;
			case CC.FORWARD:
				transport.fastForward();
				break;
			case CC.STOP:
				transport.stop();
				break;
			case CC.PLAY:
				transport.play();
				break;
			case CC.RECORD:
				cursorTrack.getArm().toggle();
				transport.record();
				break;
			}
		}
		else if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC)
		{
			// Handle slider for trackvolume
			if (data1 == CC.SLIDER)
			{
				cursorTrack.getVolume().set(data2, 128);
			}
			else
			{
				// Handle CC 02 - 109
				if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC)
				{
					var index = data1 - LOWEST_CC;
					userControls.getControl(index).set(data2, 128);
				}
			}
		}
		
	}
}
