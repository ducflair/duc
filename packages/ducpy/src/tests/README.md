# ducpy test suite

To verify the tests output run the command `bun ducpy:test`. 
If you want to only output the test results run the command `bun ducpy:test | tail -65`.


## Kinds of tests

The tests in this directory are designed to validate the functionality of the `ducpy` package. They cover various aspects of the package, including:
- Serialization and deserialization of DUC files
- Creation using the builders api
- CSPMDS tests: These tests are designed to validate specific properties of the Duc file format, they stand for: Create-Serialize-Parse(the previous serialized file)-Mutate-Delete(some)-Serialize.