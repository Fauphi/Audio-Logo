# audio-logo
Adds an audio logo to a (music) track with SOX audio library

####INFO: 
This script uses ES6 features and needs at least node v5.6.0.

### Install SOX with mp3 support
http://sox.sourceforge.net/

#### Ubuntu:
```
sudo apt-get install sox
sudo apt-get install libsox-fmt-mp3
```
#### OSX (with http://brew.sh/):
```
brew install sox --with-lame
```


### Needed files

You need a __files/logo.mp3__ file that contains the audio logo. Also a WAV-file of the track to which you want to add the audio logo. You have to pass the name as an argument (see below).

#### Settings

##### FADE_TIME (default value: 0.4)

The times it takes to fade between full volume an TRIM_DB.

##### LOGO_DISTANCE (default value:12)

Distance between the beginning of one logo to the beginning of the next logo.

##### LOGO_LENGTH (default value:2)

Length of the audio logo in seconds.

##### TRIM_DB (default value:-3)

Trims the original tracks volume to the value (dB) while the audio logo is playing.

##### LOGO_DB_NUMBER (default value:26)

The script uses the RMS delta value of the original track to calculate the volume of the audio logo for each track individually. 
If you think the logo volume gets to loud increase this value, otherwise decrease it.

##### SAMPLE_RATE (default value:48000)

Sample rate of the output file.

##### OFFSET_START (default value:10)

Offset for the first logo (in seconds).



### Usage

```
node main.js [track file path] [track length in seconds]
```

#### Example

```
node main.js /opt/files/my-score.wav 230
```
