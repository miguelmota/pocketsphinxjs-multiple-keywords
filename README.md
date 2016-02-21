# Pocketsphinx.js Multiple Keyword example

This is an example of how to use mutiple keywords with [Pocketsphinx.js](https://github.com/syl22-00/pocketsphinx.js).

# Demo

[https://lab.moogs.io/pocketsphinxjs-mutltiple-keywords](https://lab.moogs.io/pocketsphinxjs-mutltiple-keywords)

## Running example

```bash
$ git clone https://github.com/miguelmota/pocketsphinxjs-multiple-keywords.git
$ cd pocketsphinxjs-multiple-keywords
$ python -m SimpleHTTPServer 8000
```

Navigate to 'http://localhost:8000' in your browser.

## Generating pocketsphinx.js with dictionary

Download [Portable Emscripten](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html):

```bash
$ cd ~/Downloads/emsdk_portable

# Fetch the latest registry of available tools.
$ ./emsdk update

# Download and install the latest SDK tools.
$ ./emsdk install latest

# Make the "latest" SDK "active"
$ ./emsdk activate latest
```

Download [Emscripten](https://github.com/kripken/emscripten):

```bash
$ cd ~/Downloads

$ git clone https://github.com/kripken/emscripten.git
```

Download [Pocketsphinx.js](https://github.com/syl22-00/pocketsphinx.js)

```bash
$ git clone https://github.com/syl22-00/pocketsphinx.js.git
$ git submodule init
$ git submodule update
```

Create a dictionary file:

```bash
$ cd ~/Downloads/pocketsphinx.js/

$ mkdir dicts

$ vim dicts/keyphrase.dict
```

`keyphrase.dict`:

``text
CAT K AE T
DOG D AO G
FISH F IH SH
```

Note: Check out the [CMU Sphinx Pronouncing Dictionary](http://svn.code.sf.net/p/cmusphinx/code/trunk/cmudict/sphinxdict/) for getting the English dictionary phonemes. For convenience I have wrapped it in a CLI tool, [`cmusphinxdict`](https://github.com/miguelmota/cmusphinxdict).


Now compile pocketsphinx with dictionary.

```bash
cd ~/Downloads/pocketsphinx.js/

$ cmake -DEMSCRIPTEN=1 -DCMAKE_TOOLCHAIN_FILE=/Users/username/Downloads/emscripten/cmake/Modules/Platform/Emscripten.cmake -DDICT_BASE=./dicts -DDICT_FILES=keyphrase.dict .

Copying /Users/username/Sandbox/pocketsphinx.js/am/rm1_200 to binary dir
Copying ./dicts/keyphrase.dict to binary dir
-- Configuring done
-- Generating done
-- Build files have been written to: /Users/username/Sandbox/pocketsphinx.js
```

Then run `make` to generate `pocketsphinx.js` file containing dictionary.

```bash
$ make

[  1%] Building CXX object CMakeFiles/pocketsphinx.dir/src/psRecognizer.cpp.o
...
[100%] Built target pocketsphinx.js
```

Note: You can also compile pocketsphinx without a dictionary to add the words dynamically.

```bash
$ cmake -DEMSCRIPTEN=1 -DCMAKE_TOOLCHAIN_FILE=/Users/username/Downloads/emscripten/cmake/Modules/Platform/Emscripten.cmake  .
```

## Generating keyword list for pocketsphinx.js

```bash
cd ~/Downloads/pocketsphinx.js/

vim keyphrase.list
```

`keyphrase.list`:

```
CAT /1e-15/
DOG /1e-15/
FISH /1e-12/
```

Notes on keyphrase thresholds:
  - One phrase per line with threshold for each phrase.
  - Threshold must be selected to avoid false alarms.
  - The threshold depends on the word, for optimal detection you need to use word-specific thresholds.

  - Default threshold is `1`.
  - Threshold can be in scientific notation or decimal notation: `/1e-1/` or `/0.1/`
  - If you have too many false alarms try reducing keyword threshold .
  - Try keyword threshold values as `1e-60`, `1e-40`, `1e-20`, `1e-10`.
  - Bigger threshold drops uncertain occurrences of keyword, decreasing amount of false alarms. Ex `1e-10 > 1e-30`.

Compile keyhprases to JavaScript file for pocketsphinx.js:

```bash
$ cd ~/Downloads/pocketsphinx.js/

$ python ../emscripten/tools/file_packager.py ./pocketsphinx.js --embed keyphrase.list --js-output=keyphrase-list.js
```

# Testing keyphrase list in command line

[Pocketphinx](http://cmusphinx.sourceforge.net/wiki/tutorialpocketsphinx) comes with `pocketsphinx_continuous` which allows you to do live testing.

```bash
$ cd ~/Downloads/pocketsphinx.js/

$ pocketsphinx_continuous -inmic yes -kws keyphrase.list -dict dicts/keyphrase.dic
```

You can also record an audio file using [sox](http://sox.sourceforge.net/) and use that instead of the live microphone:

```bash
sox -d -c 1 -r 16000 -e signed -b 16 dog.wav
```

```bash
$ pocketsphinx_continuous -infile dog.wav -kws keyphrase.list -dict dicts/keyphrase.dict
```


# License

PocketSphinx is released under the BSD License.

PocketSphinx.js is released under the MIT License.

This example is released under the MIT License.
