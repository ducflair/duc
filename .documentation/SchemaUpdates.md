these are the files you must change from the duc repo:

on the typescript side:
@duc/packages/ducjs/src/types/index.ts 
@duc/packages/ducjs/src/restore/restoreDataState.ts (and other potential restore files related)
@duc/packages/ducjs/src/parse.ts 
@duc/packages/ducjs/src/serialize.ts 

on the rust side:
@duc/packages/ducrs/src/types.rs 
@duc/packages/ducrs/src/parse.rs 
@duc/packages/ducrs/src/serialize.rs 

on the python side: 
@duc/packages/ducpy/src/ducpy/classes/DataStateClass.py 
@duc/packages/ducpy/src/ducpy/parse.py 
@duc/packages/ducpy/src/ducpy/serialize.py 

And then run the build (or test commands if available) for each from @duc/package.json 

and in case you need to check the fbs schema: @duc/schema/duc.fbs 