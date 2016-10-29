# audio-logo
Adds an audio logo to a (music) track with SOX audio library


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

You need a __audio_logo.mp3__ file that contains the audio logo. Also a WAV-file of the track to which you want to add the audio logo. The track file either has to be named __original.wav__ or you have to pass the name as an argument (see below).



### Usage

```
npm start [trim in db] [logo volume in dB] [track file path]
```

#### Example

```
npm start -10 -3 /opt/files/my-score.wav
```
