import tempfile
from pathlib import Path

import ducpy as duc
from ducpy.serialize import _element_to_camel
from ducpy.utils.convert import to_serializable


def test_layer_and_image_builders_match_native_serde_fields():
    layer = duc.StateBuilder().with_id('layer').build_layer().with_label('Layer').build()
    image = duc.ElementBuilder().with_id('image').with_size(100, 60).build_image_element().with_file_id('png').build()
    assert to_serializable(layer)['label'] == 'Layer'
    assert _element_to_camel(image)['scaleFlip'] == [1.0, 1.0]
    assert to_serializable({'stack_base': {'label': 'Layer'}})['label'] == 'Layer'
    with tempfile.TemporaryDirectory() as directory:
        output = Path(directory) / 'builders.duc'
        duc.serialize_duc(name='builders', output_path=output, layers=[layer], elements=[image], validate_embedded_code=False)
        parsed = duc.parse_duc(output)
        assert parsed['layers'][0]['label'] == 'Layer'
        assert parsed['elements'][0]['type'] == 'image'


def test_external_file_and_revision_identifiers_are_never_case_converted():
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / 'files.duc'
        file_id = 'MixedCASE_File-id'
        data = b'original bytes'
        file = duc.StateBuilder().build_external_file().with_key(file_id).with_data(data).with_mime_type('text/plain').build()
        duc.serialize_duc(name='files', output_path=path, external_files={file_id: file}, validate_embedded_code=False)
        parsed = duc.parse_duc(path)
        assert file_id in parsed['files']
        revision = parsed['files'][file_id]['active_revision_id']
        assert revision in parsed['files'][file_id]['revisions']
        extracted = Path(directory) / 'body'
        duc.stream_external_file_revision_to_path(path, revision, extracted)
        assert extracted.read_bytes() == data


def test_stack_elements_keep_nested_stack_base_while_layers_flatten_it():
    layer = duc.StateBuilder().with_id('layer').build_layer().with_label('Layer').build()
    elements = [
        duc.ElementBuilder().with_id('frame').with_size(100, 60).build_frame_element().build(),
        duc.ElementBuilder().with_id('plot').with_size(100, 60).build_plot_element().build(),
        duc.ElementBuilder().with_id('model').with_size(100, 60).build_model_element().with_model_type('python').with_code('print(1)').build(),
    ]
    assert 'stackBase' not in to_serializable(layer)
    for element in elements[:2]:
        assert 'label' in _element_to_camel(element)['stackBase']
    with tempfile.TemporaryDirectory() as directory:
        output = Path(directory) / 'stacks.duc'
        duc.serialize_duc(name='stacks', output_path=output, layers=[layer], elements=elements, validate_embedded_code=False)
        parsed = duc.parse_duc(output)
        assert {element['type'] for element in parsed['elements']} == {'frame', 'plot', 'model'}
        duc.serialize_duc(name='stacks', output_path=output, layers=parsed['layers'], elements=parsed['elements'], validate_embedded_code=False)
        assert len(duc.parse_duc(output)['elements']) == 3
