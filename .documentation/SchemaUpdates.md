these are the files you must change from the duc repo:

on the rust side:
@duc/packages/ducrs/src/types.rs 
@duc/packages/ducrs/src/parse.rs 
@duc/packages/ducrs/src/serialize.rs 

on the typescript side:
@duc/packages/ducjs/src/types/index.ts 
@packages/ducjs/src/types/elements/index.ts 
@duc/packages/ducjs/src/restore/restoreDataState.ts (and other potential restore files related)


on the python side: 
@duc/packages/ducpy/src/ducpy/classes/DataStateClass.py 
@packages/ducpy/src/ducpy/classes/ElementsClass.py 

And then run the build (or test commands if available) for each from @duc/package.json 

and in case you need to check the fbs schema or what changed (changes may be git staged): @duc/schema/duc.sql 

migrations for the .sql files may need to be created by running the following the folder and adding on top of the last one: schema/migrations