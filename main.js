/*
* @Author: philipp
* @Date:   2016-10-28 18:21:49
* @Last Modified by:   Philipp
* @Last Modified time: 2016-11-02 12:42:38
*/

'use strict';

const SoxCommand 	= require('sox-audio')
,	spawn 		   	= require('child_process').spawn;

const AUDIO_LOGO = 'files/logo.mp3'
,	FADE_TIME = 0.4
, 	LOGO_DISTANCE = 12
,	LOGO_LENGTH = 2
,	TRIM_DB = -3
,	LOGO_DB_NUMBER = 26
,	SAMPLE_RATE = 48000
,	OFFSET_START = 10;

let DEMO = ''
,	WAV = ''
,	TRACK_LENGTH_SEC = 187
,	LOGO_COUNT = 0
,	SC_AMOUNT = 0
,	GAIN = 0;

class Demo {
	
	constructor() {
	}

	_calcLength(length) {
		const bitCount = Math.floor((length-OFFSET_START) / LOGO_DISTANCE)
		,   offset = (12*2)-4;

		return (bitCount*12)+OFFSET_START;	
	}

	_createFadeOutSC(from) {
		const trim = from-FADE_TIME
		,	fadeFrom = (from==OFFSET_START)?OFFSET_START:0
		,	trimFrom = (from==OFFSET_START)?0:trim
		,	trimLength = (from==OFFSET_START)?OFFSET_START+FADE_TIME:FADE_TIME;

		return SoxCommand()
			.input(WAV)
			.input('-V1 -S')
			.addEffect('trim', [trimFrom, trimLength])
			.addEffect('fade', ['t', '0', (fadeFrom), FADE_TIME]) // starts at 0 because of trim
			.addEffect('pad', [(trimFrom)])
			.output('-p')
			.outputSampleRate(SAMPLE_RATE);
	}

	_createTrimSC(from, to, trimdB) {
		return SoxCommand()
			.input(WAV)
			.input('-V1 -S')
			.addEffect('trim', [(from-FADE_TIME), (FADE_TIME+LOGO_LENGTH+FADE_TIME)]) // [from, length]
			.addEffect('fade', ['t', FADE_TIME, FADE_TIME+LOGO_LENGTH, FADE_TIME])
			.addEffect('gain', [trimdB])
			.addEffect('pad', [(from-FADE_TIME)])
			.output('-p')
			.outputSampleRate(SAMPLE_RATE);
	}

	_createFadeInSC(to) {
		return SoxCommand()
			.input(WAV)
			.input('-V1 -S')
			.addEffect('trim', [to-FADE_TIME, (LOGO_DISTANCE-LOGO_LENGTH)])
			.addEffect('fade', ['t', FADE_TIME, '0', '0'])
			.addEffect('pad', [to-FADE_TIME])
			.output('-p')
			.outputSampleRate(SAMPLE_RATE);
	}

	_soxCommand(trimdB, logodB) {
		console.log('LOGO DB: ', logodB);
		console.log('TRIM DB: ', trimdB);

		const trimAudioLogo = SoxCommand()
	        .input(AUDIO_LOGO)
	        .addEffect('gain', [logodB])
	        .output('-p')
	        .outputSampleRate(SAMPLE_RATE)
	        .trim('0', this._calcLength(TRACK_LENGTH_SEC));

		const createDemo = SoxCommand().inputSubCommand(trimAudioLogo);

		for(let i=LOGO_COUNT;i--;) {
			const start = (OFFSET_START+12*i)
			,	end = start+LOGO_LENGTH;

			createDemo.inputSubCommand(this._createFadeOutSC(start));
			createDemo.inputSubCommand(this._createTrimSC(start, end, trimdB));
			createDemo.inputSubCommand(this._createFadeInSC(end));
		}

		createDemo.output(DEMO)
			.outputFileType('mp3')
			.combine('mix')
			.addEffect('gain', [GAIN]);	

		return createDemo;
	}

	_rmsDelta() {
		return new Promise((resolve, reject) => {
			var ls = spawn('sox', [WAV, '-n', 'stat']);

			let outputStr = ''
			,	stdoutClosed = false
			,	stderrClosed = false;

			const handleClose = () => {
				const str = outputStr;

			    const rx = new RegExp(/(RMS(\s+)delta):(\s+)([0-9]+).([0-9]+)/g);
			    let	res = str.match(rx)
			    ,	rmsDelta = 0;
			    
			    if(res && res.length>0) {
			    	res = res[0];
				    const rx2 = new RegExp(/([0-9]+).([0-9]+)/g);
				    rmsDelta = Number(res.match(rx2)[0]);
				}

				resolve(rmsDelta);
			}

			ls.stdout.on('data', function(data){
			    outputStr += data.toString();
			});

			ls.stderr.on('data', function(data) {
			    outputStr += data.toString();
			});
			
			ls.stdout.on('close', function() {
				stdoutClosed = true;
				if(stdoutClosed && stderrClosed) handleClose();
			});

			ls.stderr.on('close', function() {
				stderrClosed = true;
				if(stdoutClosed && stderrClosed) handleClose();
			});
		});
	}

	create(trackFilePath, duration) {
		WAV = trackFilePath || process.argv[2];
		TRACK_LENGTH_SEC = duration || process.argv[3];
		DEMO = 'files/DEMO-'+WAV.replace('files/testsongs/', '').replace('.wav', '')+'.mp3';
		LOGO_COUNT = Math.floor((TRACK_LENGTH_SEC-8) / 12);
		SC_AMOUNT = LOGO_COUNT*3+1;
		GAIN = (Math.log(SC_AMOUNT)/Math.log(10))*20;;

		const rmsDelta = this._rmsDelta().then((res) => {
			console.log('RMS DELTA: ', res);
			console.log('LOGO DB CALC: ', '- ( '+LOGO_DB_NUMBER+' - ( '+res+' * 100 )');

			const logodB = -(LOGO_DB_NUMBER-(res*100))
			,	createDemo = this._soxCommand(TRIM_DB, logodB)
			,	start = new Date().getTime();

		    // callbacks
		    createDemo
		    	.on('start', () => {
		        	console.log('Starting to create the demo file, this may take a while...');
		        })
		        .on('progress', () => {
		        	console.log('progress');
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
		});
	}
}

new Demo().create();


