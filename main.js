/*
* @Author: philipp
* @Date:   2016-10-28 18:21:49
* @Last Modified by:   philipp
* @Last Modified time: 2016-10-29 11:32:04
*/

'use strict';

const SoxCommand = require('sox-audio');

const AUDIO_LOGO = 'audio_logo.mp3'
,	WAV = process.argv[4] || 'original.wav'
,	DEMO = 'demo.mp3'
,	TRACK_LENGTH_SEC = 101
,	FADE_TIME = 0.4
, 	LOGO_DISTANCE = 12
,	LOGO_LENGTH = 2
,	LOGO_DB = Number(process.argv[3]) || -3
,	TRIM_DB = Number(process.argv[2]) || -10
,	SAMPLE_RATE = 48000
,	LOGO_COUNT = Math.floor((TRACK_LENGTH_SEC-8) / 12)
,	SC_AMOUNT = LOGO_COUNT*3+1
,	GAIN = (Math.log(SC_AMOUNT)/Math.log(10))*20;;

class Demo {
	
	constructor() {
		const msg = `
Usage: node main.js [Track Trim Volume db] [Logo Volumen dB] [Track file path]

################
# DEMO CONFIG: #
################

TRACK PATH: ${WAV}

TRACK TRIM VOLUME: ${TRIM_DB} dB

LOGO VOLUME: ${LOGO_DB} dB

FADE TIME: ${FADE_TIME} sec

SAMPLE RATE: ${SAMPLE_RATE} Hz

LOGO COUNT: ${LOGO_COUNT}
		`;
		console.log(msg);
	}

	_calcLength(length) {
		const bitCount = Math.floor((length-8) / 12)
		,   offset = (12*2)-4;
		return (bitCount*12)+8-offset;	
	}

	_createFadeOutSC(from) {
		const trim = from-FADE_TIME
		,	fadeFrom = (from==8)?8:0
		,	trimFrom = (from==8)?0:trim
		,	trimLength = (from==8)?8+FADE_TIME:FADE_TIME;

		return SoxCommand()
			.input(WAV)
			.input('-V1')
			.addEffect('trim', [trimFrom, trimLength])
			.addEffect('fade', ['t', '0', (fadeFrom), FADE_TIME]) // starts at 0 because of trim
			.addEffect('pad', [(trimFrom)])
			.output('-p')
			.outputSampleRate(SAMPLE_RATE);
	}

	_createTrimSC(from, to) {
		return SoxCommand()
			.input(WAV)
			.input('-V1')
			.addEffect('trim', [(from-FADE_TIME), (FADE_TIME+LOGO_LENGTH+FADE_TIME)]) // [from, length]
			.addEffect('fade', ['t', FADE_TIME, FADE_TIME+LOGO_LENGTH, FADE_TIME])
			.addEffect('gain', [TRIM_DB])
			.addEffect('pad', [(from-FADE_TIME)])
			.output('-p')
			.outputSampleRate(SAMPLE_RATE);
	}

	_createFadeInSC(to) {
		return SoxCommand()
			.input(WAV)
			.input('-V1')
			.addEffect('trim', [to-FADE_TIME, (LOGO_DISTANCE-LOGO_LENGTH)])
			.addEffect('fade', ['t', FADE_TIME, '0', '0'])
			.addEffect('pad', [to-FADE_TIME])
			.output('-p')
			.outputSampleRate(SAMPLE_RATE);
	}

	create() {
		const trimAudioLogo = SoxCommand()
	        .input(AUDIO_LOGO)
	        .addEffect('gain', [LOGO_DB])
	        .output('-p')
	        .outputSampleRate(SAMPLE_RATE)
	        .trim('0', this._calcLength(TRACK_LENGTH_SEC));

		const createDemo = SoxCommand().inputSubCommand(trimAudioLogo);

		for(let i=LOGO_COUNT;i--;) {
			const start = (8+12*i)
			,	end = start+LOGO_LENGTH;

			createDemo.inputSubCommand(this._createFadeOutSC(start));
			createDemo.inputSubCommand(this._createTrimSC(start, end));
			createDemo.inputSubCommand(this._createFadeInSC(end));
		}

		createDemo.output(DEMO)
			.outputFileType('mp3')
			.combine('mix')
			.addEffect('gain', [GAIN]);

		const start = new Date().getTime();

	    // callbacks
	    createDemo
	    	.on('start', () => {
	        	console.log('Starting to create the demo file, this may take a while...');
	        })
	        .on('end', () => {
	            const end = new Date().getTime();

			    var seconds = (end-start) / 1000;
			    seconds = seconds % 3600;
			    var minutes = parseInt( seconds / 60 );
			    seconds = seconds % 60;
			    seconds = (seconds<10)?'0'+seconds.toFixed(0):seconds.toFixed(0)
			    console.log('');
			    console.log('Success!');
			    console.log('Demo created in: '+minutes+":"+seconds+'');
			    console.log('=> '+DEMO);
			    console.log('');
	        })
	        .on('error', (err, stdout, stderr) => {
	            console.log('------ CREATING DEMO FAILED ------');
	            console.log('Cannot process audio: ' + err.message);
	            console.log('Sox Command Stdout: ', stdout);
	            console.log('Sox Command Stderr: ', stderr);
	        });

	    createDemo.run();
	}
}

new Demo().create();


