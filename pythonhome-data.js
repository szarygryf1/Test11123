
var Module = typeof Module !== 'undefined' ? Module : {};

if (!Module.expectedDataFileDownloads) {
  Module.expectedDataFileDownloads = 0;
  Module.finishedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function() {
 var loadPackage = function(metadata) {

    var PACKAGE_PATH;
    if (typeof window === 'object') {
      PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
    } else if (typeof location !== 'undefined') {
      // worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
    } else {
      throw 'using preloaded data can only be done on a web page or in a web worker';
    }
    var PACKAGE_NAME = '/home/me/workdir/emtests/renpyweb/build/t/pythonhome.data';
    var REMOTE_PACKAGE_BASE = 'pythonhome.data';
    if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
      Module['locateFile'] = Module['locateFilePackage'];
      err('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
    }
    var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
  
    var REMOTE_PACKAGE_SIZE = metadata.remote_package_size;
    var PACKAGE_UUID = metadata.package_uuid;
  
    function fetchRemotePackage(packageName, packageSize, callback, errback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', packageName, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function(event) {
        var url = packageName;
        var size = packageSize;
        if (event.total) size = event.total;
        if (event.loaded) {
          if (!xhr.addedTotal) {
            xhr.addedTotal = true;
            if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
            Module.dataFileDownloads[url] = {
              loaded: event.loaded,
              total: size
            };
          } else {
            Module.dataFileDownloads[url].loaded = event.loaded;
          }
          var total = 0;
          var loaded = 0;
          var num = 0;
          for (var download in Module.dataFileDownloads) {
          var data = Module.dataFileDownloads[download];
            total += data.total;
            loaded += data.loaded;
            num++;
          }
          total = Math.ceil(total * Module.expectedDataFileDownloads/num);
          if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
        } else if (!Module.dataFileDownloads) {
          if (Module['setStatus']) Module['setStatus']('Downloading data...');
        }
      };
      xhr.onerror = function(event) {
        throw new Error("NetworkError for: " + packageName);
      }
      xhr.onload = function(event) {
        if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
          var packageData = xhr.response;
          callback(packageData);
        } else {
          throw new Error(xhr.statusText + " : " + xhr.responseURL);
        }
      };
      xhr.send(null);
    };

    function handleError(error) {
      console.error('package error:', error);
    };
  
  function runWithFS() {

    function assert(check, msg) {
      if (!check) throw msg + new Error().stack;
    }
Module['FS_createPath']('/', 'lib', true, true);
Module['FS_createPath']('/lib', 'python2.7', true, true);
Module['FS_createPath']('/lib/python2.7', 'importlib', true, true);
Module['FS_createPath']('/lib/python2.7', 'json', true, true);
Module['FS_createPath']('/lib/python2.7', 'encodings', true, true);
Module['FS_createPath']('/lib/python2.7', 'xml', true, true);
Module['FS_createPath']('/lib/python2.7/xml', 'etree', true, true);

    function DataRequest(start, end, audio) {
      this.start = start;
      this.end = end;
      this.audio = audio;
    }
    DataRequest.prototype = {
      requests: {},
      open: function(mode, name) {
        this.name = name;
        this.requests[name] = this;
        Module['addRunDependency']('fp ' + this.name);
      },
      send: function() {},
      onload: function() {
        var byteArray = this.byteArray.subarray(this.start, this.end);
        this.finish(byteArray);
      },
      finish: function(byteArray) {
        var that = this;

        Module['FS_createDataFile'](this.name, null, byteArray, true, true, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
        Module['removeRunDependency']('fp ' + that.name);

        this.requests[this.name] = null;
      }
    };

        var files = metadata.files;
        for (var i = 0; i < files.length; ++i) {
          new DataRequest(files[i].start, files[i].end, files[i].audio).open('GET', files[i].filename);
        }

  
      var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      var IDB_RO = "readonly";
      var IDB_RW = "readwrite";
      var DB_NAME = "EM_PRELOAD_CACHE";
      var DB_VERSION = 1;
      var METADATA_STORE_NAME = 'METADATA';
      var PACKAGE_STORE_NAME = 'PACKAGES';
      function openDatabase(callback, errback) {
        try {
          var openRequest = indexedDB.open(DB_NAME, DB_VERSION);
        } catch (e) {
          return errback(e);
        }
        openRequest.onupgradeneeded = function(event) {
          var db = event.target.result;

          if(db.objectStoreNames.contains(PACKAGE_STORE_NAME)) {
            db.deleteObjectStore(PACKAGE_STORE_NAME);
          }
          var packages = db.createObjectStore(PACKAGE_STORE_NAME);

          if(db.objectStoreNames.contains(METADATA_STORE_NAME)) {
            db.deleteObjectStore(METADATA_STORE_NAME);
          }
          var metadata = db.createObjectStore(METADATA_STORE_NAME);
        };
        openRequest.onsuccess = function(event) {
          var db = event.target.result;
          callback(db);
        };
        openRequest.onerror = function(error) {
          errback(error);
        };
      };

      // This is needed as chromium has a limit on per-entry files in IndexedDB
      // https://cs.chromium.org/chromium/src/content/renderer/indexed_db/webidbdatabase_impl.cc?type=cs&sq=package:chromium&g=0&l=177
      // https://cs.chromium.org/chromium/src/out/Debug/gen/third_party/blink/public/mojom/indexeddb/indexeddb.mojom.h?type=cs&sq=package:chromium&g=0&l=60
      // We set the chunk size to 64MB to stay well-below the limit
      var CHUNK_SIZE = 64 * 1024 * 1024;

      function cacheRemotePackage(
        db,
        packageName,
        packageData,
        packageMeta,
        callback,
        errback
      ) {
        var transactionPackages = db.transaction([PACKAGE_STORE_NAME], IDB_RW);
        var packages = transactionPackages.objectStore(PACKAGE_STORE_NAME);
        var chunkSliceStart = 0;
        var nextChunkSliceStart = 0;
        var chunkCount = Math.ceil(packageData.byteLength / CHUNK_SIZE);
        var finishedChunks = 0;
        for (var chunkId = 0; chunkId < chunkCount; chunkId++) {
          nextChunkSliceStart += CHUNK_SIZE;
          var putPackageRequest = packages.put(
            packageData.slice(chunkSliceStart, nextChunkSliceStart),
            'package/' + packageName + '/' + chunkId
          );
          chunkSliceStart = nextChunkSliceStart;
          putPackageRequest.onsuccess = function(event) {
            finishedChunks++;
            if (finishedChunks == chunkCount) {
              var transaction_metadata = db.transaction(
                [METADATA_STORE_NAME],
                IDB_RW
              );
              var metadata = transaction_metadata.objectStore(METADATA_STORE_NAME);
              var putMetadataRequest = metadata.put(
                {
                  uuid: packageMeta.uuid,
                  chunkCount: chunkCount
                },
                'metadata/' + packageName
              );
              putMetadataRequest.onsuccess = function(event) {
                callback(packageData);
              };
              putMetadataRequest.onerror = function(error) {
                errback(error);
              };
            }
          };
          putPackageRequest.onerror = function(error) {
            errback(error);
          };
        }
      }

      /* Check if there's a cached package, and if so whether it's the latest available */
      function checkCachedPackage(db, packageName, callback, errback) {
        var transaction = db.transaction([METADATA_STORE_NAME], IDB_RO);
        var metadata = transaction.objectStore(METADATA_STORE_NAME);
        var getRequest = metadata.get('metadata/' + packageName);
        getRequest.onsuccess = function(event) {
          var result = event.target.result;
          if (!result) {
            return callback(false, null);
          } else {
            return callback(PACKAGE_UUID === result.uuid, result);
          }
        };
        getRequest.onerror = function(error) {
          errback(error);
        };
      }

      function fetchCachedPackage(db, packageName, metadata, callback, errback) {
        var transaction = db.transaction([PACKAGE_STORE_NAME], IDB_RO);
        var packages = transaction.objectStore(PACKAGE_STORE_NAME);

        var chunksDone = 0;
        var totalSize = 0;
        var chunks = new Array(metadata.chunkCount);

        for (var chunkId = 0; chunkId < metadata.chunkCount; chunkId++) {
          var getRequest = packages.get('package/' + packageName + '/' + chunkId);
          getRequest.onsuccess = function(event) {
            // If there's only 1 chunk, there's nothing to concatenate it with so we can just return it now
            if (metadata.chunkCount == 1) {
              callback(event.target.result);
            } else {
              chunksDone++;
              totalSize += event.target.result.byteLength;
              chunks.push(event.target.result);
              if (chunksDone == metadata.chunkCount) {
                if (chunksDone == 1) {
                  callback(event.target.result);
                } else {
                  var tempTyped = new Uint8Array(totalSize);
                  var byteOffset = 0;
                  for (var chunkId in chunks) {
                    var buffer = chunks[chunkId];
                    tempTyped.set(new Uint8Array(buffer), byteOffset);
                    byteOffset += buffer.byteLength;
                    buffer = undefined;
                  }
                  chunks = undefined;
                  callback(tempTyped.buffer);
                  tempTyped = undefined;
                }
              }
            }
          };
          getRequest.onerror = function(error) {
            errback(error);
          };
        }
      }
    
    function processPackageData(arrayBuffer) {
      Module.finishedDataFileDownloads++;
      assert(arrayBuffer, 'Loading data file failed.');
      assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
      var byteArray = new Uint8Array(arrayBuffer);
      var curr;
      
        // Reuse the bytearray from the XHR as the source for file reads.
        DataRequest.prototype.byteArray = byteArray;
  
          var files = metadata.files;
          for (var i = 0; i < files.length; ++i) {
            DataRequest.prototype.requests[files[i].filename].onload();
          }
              Module['removeRunDependency']('datafile_/home/me/workdir/emtests/renpyweb/build/t/pythonhome.data');

    };
    Module['addRunDependency']('datafile_/home/me/workdir/emtests/renpyweb/build/t/pythonhome.data');
  
    if (!Module.preloadResults) Module.preloadResults = {};
  
      function preloadFallback(error) {
        console.error(error);
        console.error('falling back to default preload behavior');
        fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, processPackageData, handleError);
      };

      openDatabase(
        function(db) {
          checkCachedPackage(db, PACKAGE_PATH + PACKAGE_NAME,
            function(useCached, metadata) {
              Module.preloadResults[PACKAGE_NAME] = {fromCache: useCached};
              if (useCached) {
                console.info('loading ' + PACKAGE_NAME + ' from cache');
                fetchCachedPackage(db, PACKAGE_PATH + PACKAGE_NAME, metadata, processPackageData, preloadFallback);
              } else {
                console.info('loading ' + PACKAGE_NAME + ' from remote');
                fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE,
                  function(packageData) {
                    cacheRemotePackage(db, PACKAGE_PATH + PACKAGE_NAME, packageData, {uuid:PACKAGE_UUID}, processPackageData,
                      function(error) {
                        console.error(error);
                        processPackageData(packageData);
                      });
                  }
                , preloadFallback);
              }
            }
          , preloadFallback);
        }
      , preloadFallback);

      if (Module['setStatus']) Module['setStatus']('Downloading...');
    
  }
  if (Module['calledRun']) {
    runWithFS();
  } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
  }

 }
 loadPackage({"files": [{"start": 0, "audio": 0, "end": 20204, "filename": "/lib/python2.7/string.pyo"}, {"start": 20204, "audio": 0, "end": 22894, "filename": "/lib/python2.7/types.pyo"}, {"start": 22894, "audio": 0, "end": 26457, "filename": "/lib/python2.7/io.pyo"}, {"start": 26457, "audio": 0, "end": 37762, "filename": "/lib/python2.7/posixpath.pyo"}, {"start": 37762, "audio": 0, "end": 41224, "filename": "/lib/python2.7/genericpath.pyo"}, {"start": 41224, "audio": 0, "end": 77969, "filename": "/lib/python2.7/platform.pyo"}, {"start": 77969, "audio": 0, "end": 86564, "filename": "/lib/python2.7/UserDict.pyo"}, {"start": 86564, "audio": 0, "end": 92734, "filename": "/lib/python2.7/sre_constants.pyo"}, {"start": 92734, "audio": 0, "end": 104676, "filename": "/lib/python2.7/copy.pyo"}, {"start": 104676, "audio": 0, "end": 119151, "filename": "/lib/python2.7/heapq.pyo"}, {"start": 119151, "audio": 0, "end": 158797, "filename": "/lib/python2.7/inspect.pyo"}, {"start": 158797, "audio": 0, "end": 159031, "filename": "/lib/python2.7/struct.pyo"}, {"start": 159031, "audio": 0, "end": 161126, "filename": "/lib/python2.7/keyword.pyo"}, {"start": 161126, "audio": 0, "end": 173944, "filename": "/lib/python2.7/ast.pyo"}, {"start": 173944, "audio": 0, "end": 193781, "filename": "/lib/python2.7/sre_parse.pyo"}, {"start": 193781, "audio": 0, "end": 199707, "filename": "/lib/python2.7/functools.pyo"}, {"start": 199707, "audio": 0, "end": 205827, "filename": "/lib/python2.7/opcode.pyo"}, {"start": 205827, "audio": 0, "end": 209618, "filename": "/lib/python2.7/token.pyo"}, {"start": 209618, "audio": 0, "end": 224005, "filename": "/lib/python2.7/urlparse.pyo"}, {"start": 224005, "audio": 0, "end": 298607, "filename": "/lib/python2.7/tarfile.pyo"}, {"start": 298607, "audio": 0, "end": 302191, "filename": "/lib/python2.7/fnmatch.pyo"}, {"start": 302191, "audio": 0, "end": 321453, "filename": "/lib/python2.7/_sysconfigdata.pyo"}, {"start": 321453, "audio": 0, "end": 330891, "filename": "/lib/python2.7/_weakrefset.pyo"}, {"start": 330891, "audio": 0, "end": 368647, "filename": "/lib/python2.7/pickle.pyo"}, {"start": 368647, "audio": 0, "end": 375511, "filename": "/lib/python2.7/hashlib.pyo"}, {"start": 375511, "audio": 0, "end": 387839, "filename": "/lib/python2.7/sre_compile.pyo"}, {"start": 387839, "audio": 0, "end": 395317, "filename": "/lib/python2.7/shlex.pyo"}, {"start": 395317, "audio": 0, "end": 413535, "filename": "/lib/python2.7/shutil.pyo"}, {"start": 413535, "audio": 0, "end": 433244, "filename": "/lib/python2.7/tempfile.pyo"}, {"start": 433244, "audio": 0, "end": 458599, "filename": "/lib/python2.7/random.pyo"}, {"start": 458599, "audio": 0, "end": 478633, "filename": "/lib/python2.7/webbrowser.pyo"}, {"start": 478633, "audio": 0, "end": 493727, "filename": "/lib/python2.7/weakref.pyo"}, {"start": 493727, "audio": 0, "end": 504525, "filename": "/lib/python2.7/base64.pyo"}, {"start": 504525, "audio": 0, "end": 566098, "filename": "/lib/python2.7/difflib.pyo"}, {"start": 566098, "audio": 0, "end": 570291, "filename": "/lib/python2.7/__future__.pyo"}, {"start": 570291, "audio": 0, "end": 589328, "filename": "/lib/python2.7/site.pyo"}, {"start": 589328, "audio": 0, "end": 600907, "filename": "/lib/python2.7/traceback.pyo"}, {"start": 600907, "audio": 0, "end": 603810, "filename": "/lib/python2.7/glob.pyo"}, {"start": 603810, "audio": 0, "end": 609129, "filename": "/lib/python2.7/dummy_thread.pyo"}, {"start": 609129, "audio": 0, "end": 634553, "filename": "/lib/python2.7/os.pyo"}, {"start": 634553, "audio": 0, "end": 639548, "filename": "/lib/python2.7/copy_reg.pyo"}, {"start": 639548, "audio": 0, "end": 653635, "filename": "/lib/python2.7/tokenize.pyo"}, {"start": 653635, "audio": 0, "end": 717046, "filename": "/lib/python2.7/argparse.pyo"}, {"start": 717046, "audio": 0, "end": 742356, "filename": "/lib/python2.7/collections.pyo"}, {"start": 742356, "audio": 0, "end": 754098, "filename": "/lib/python2.7/textwrap.pyo"}, {"start": 754098, "audio": 0, "end": 760286, "filename": "/lib/python2.7/dis.pyo"}, {"start": 760286, "audio": 0, "end": 801486, "filename": "/lib/python2.7/zipfile.pyo"}, {"start": 801486, "audio": 0, "end": 807518, "filename": "/lib/python2.7/abc.pyo"}, {"start": 807518, "audio": 0, "end": 862420, "filename": "/lib/python2.7/locale.pyo"}, {"start": 862420, "audio": 0, "end": 865121, "filename": "/lib/python2.7/stat.pyo"}, {"start": 865121, "audio": 0, "end": 869515, "filename": "/lib/python2.7/contextlib.pyo"}, {"start": 869515, "audio": 0, "end": 874815, "filename": "/lib/python2.7/repr.pyo"}, {"start": 874815, "audio": 0, "end": 878057, "filename": "/lib/python2.7/linecache.pyo"}, {"start": 878057, "audio": 0, "end": 893400, "filename": "/lib/python2.7/gettext.pyo"}, {"start": 893400, "audio": 0, "end": 897351, "filename": "/lib/python2.7/colorsys.pyo"}, {"start": 897351, "audio": 0, "end": 909512, "filename": "/lib/python2.7/warnings.pyo"}, {"start": 909512, "audio": 0, "end": 945751, "filename": "/lib/python2.7/codecs.pyo"}, {"start": 945751, "audio": 0, "end": 970781, "filename": "/lib/python2.7/_abcoll.pyo"}, {"start": 970781, "audio": 0, "end": 988145, "filename": "/lib/python2.7/sysconfig.pyo"}, {"start": 988145, "audio": 0, "end": 1001453, "filename": "/lib/python2.7/re.pyo"}, {"start": 1001453, "audio": 0, "end": 1012838, "filename": "/lib/python2.7/StringIO.pyo"}, {"start": 1012838, "audio": 0, "end": 1014325, "filename": "/lib/python2.7/importlib/__init__.pyo"}, {"start": 1014325, "audio": 0, "end": 1016539, "filename": "/lib/python2.7/json/scanner.pyo"}, {"start": 1016539, "audio": 0, "end": 1028574, "filename": "/lib/python2.7/json/decoder.pyo"}, {"start": 1028574, "audio": 0, "end": 1042199, "filename": "/lib/python2.7/json/encoder.pyo"}, {"start": 1042199, "audio": 0, "end": 1056129, "filename": "/lib/python2.7/json/__init__.pyo"}, {"start": 1056129, "audio": 0, "end": 1058055, "filename": "/lib/python2.7/encodings/utf_8.pyo"}, {"start": 1058055, "audio": 0, "end": 1062484, "filename": "/lib/python2.7/encodings/zlib_codec.pyo"}, {"start": 1062484, "audio": 0, "end": 1064351, "filename": "/lib/python2.7/encodings/utf_32_be.pyo"}, {"start": 1064351, "audio": 0, "end": 1073116, "filename": "/lib/python2.7/encodings/aliases.pyo"}, {"start": 1073116, "audio": 0, "end": 1076681, "filename": "/lib/python2.7/encodings/hex_codec.pyo"}, {"start": 1076681, "audio": 0, "end": 1078912, "filename": "/lib/python2.7/encodings/ascii.pyo"}, {"start": 1078912, "audio": 0, "end": 1081095, "filename": "/lib/python2.7/encodings/raw_unicode_escape.pyo"}, {"start": 1081095, "audio": 0, "end": 1085453, "filename": "/lib/python2.7/encodings/__init__.pyo"}, {"start": 1085453, "audio": 0, "end": 1087714, "filename": "/lib/python2.7/encodings/latin_1.pyo"}, {"start": 1087714, "audio": 0, "end": 1088787, "filename": "/lib/python2.7/xml/__init__.pyo"}, {"start": 1088787, "audio": 0, "end": 1096280, "filename": "/lib/python2.7/xml/etree/ElementPath.pyo"}, {"start": 1096280, "audio": 0, "end": 1096404, "filename": "/lib/python2.7/xml/etree/__init__.pyo"}, {"start": 1096404, "audio": 0, "end": 1130384, "filename": "/lib/python2.7/xml/etree/ElementTree.pyo"}], "remote_package_size": 1130384, "package_uuid": "7e3b0b00-2c67-4c33-b753-0db1a9c3e9f1"});

})();
