#!/usr/bin/env python3
"""
Comprehensive test for the new hierarchical builder API.
Tests all element types using the builder pattern.
"""
import sys
import os
import pytest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

try:
    import ducpy as duc
    print("✅ Successfully imported ducpy")
except ImportError as e:
    print(f"❌ Failed to import ducpy: {e}")
    sys.exit(1)

def test_comprehensive_builder_api():
    """Test all element types with the new hierarchical builder API"""
    print("\n🧪 Testing comprehensive builder API...")
    
    elements = []
    
    try:
        # Test all element types
        print("Creating elements with builder API...")
        
        # Rectangle
        elements.append(duc.ElementBuilder()
            .at_position(10, 20)
            .with_size(100, 50)
            .with_label("Test Rectangle")
            .with_styles(duc.create_simple_styles())
            .with_z_index(1.0)
            .build_rectangle()
            .build())
        print("✅ Rectangle created")
        
        # Ellipse
        elements.append(duc.ElementBuilder()
            .at_position(200, 100)
            .with_size(80, 40)
            .with_label("Test Ellipse")
            .with_styles(duc.create_simple_styles())
            .with_z_index(2.0)
            .build_ellipse()
            .with_ratio(0.5)
            .with_start_angle(0.0)
            .with_end_angle(3.14159)
            .build())
        print("✅ Ellipse created")
        
        # Polygon
        elements.append(duc.ElementBuilder()
            .at_position(300, 200)
            .with_size(60, 60)
            .with_label("Test Polygon")
            .with_styles(duc.create_simple_styles())
            .with_z_index(3.0)
            .build_polygon()
            .with_sides(5)
            .build())
        print("✅ Polygon created")
        
        # Linear element
        elements.append(duc.ElementBuilder()
            .at_position(400, 300)
            .with_size(100, 50)
            .with_label("Test Linear")
            .with_styles(duc.create_simple_styles())
            .with_z_index(4.0)
            .build_linear_element()
            .with_points([(0,0), (50,50), (100,0)])
            .build())
        print("✅ Linear element created")
        
        # Arrow element
        elements.append(duc.ElementBuilder()
            .at_position(500, 400)
            .with_size(80, 40)
            .with_label("Test Arrow")
            .with_styles(duc.create_simple_styles())
            .with_z_index(5.0)
            .build_arrow_element()
            .with_points([(0,0), (50,50)])
            .build())
        print("✅ Arrow element created")
        
        # Text element
        elements.append(duc.ElementBuilder()
            .at_position(50, 500)
            .with_size(200, 40)
            .with_label("Test Text")
            .with_styles(duc.create_simple_styles())
            .with_z_index(6.0)
            .build_text_element()
            .with_text("Hello, Builder API!")
            .with_text_style(duc.create_text_style(font_family="Arial", font_size=18))
            .build())
        print("✅ Text element created")
        
        # FreeDraw element
        freedraw_points = [duc.DucPoint(x=float(i*10), y=float(600 + (i%2)*10), mirroring=None) for i in range(20)]
        elements.append(duc.ElementBuilder()
            .at_position(50, 600)
            .with_size(200, 50)
            .with_label("Test FreeDraw")
            .with_styles(duc.create_simple_styles())
            .with_z_index(7.0)
            .build_freedraw_element()
            .with_points(freedraw_points)
            .with_pressures([0.5 + 0.02*i for i in range(20)])
            .with_size_thickness(5.0)
            .with_thinning(0.2)
            .with_smoothing(0.3)
            .with_streamline(0.4)
            .with_easing("linear")
            .build())
        print("✅ FreeDraw element created")
        
        # Image element
        elements.append(duc.ElementBuilder()
            .at_position(300, 700)
            .with_size(120, 80)
            .with_label("Test Image")
            .with_styles(duc.create_simple_styles())
            .with_z_index(8.0)
            .build_image_element()
            .with_file_id("test_image")
            .build())
        print("✅ Image element created")
        
        # PDF element
        elements.append(duc.ElementBuilder()
            .at_position(450, 700)
            .with_size(100, 140)
            .with_label("Test PDF")
            .with_styles(duc.create_simple_styles())
            .with_z_index(9.0)
            .build_pdf_element()
            .with_file_id("test_pdf")
            .build())
        print("✅ PDF element created")
        
        # Parametric element
        elements.append(duc.ElementBuilder()
            .at_position(600, 700)
            .with_size(80, 80)
            .with_label("Test Parametric")
            .with_styles(duc.create_simple_styles())
            .with_z_index(10.0)
            .build_parametric_element()
            .with_file_id("test_step")
            .with_source_type(duc.PARAMETRIC_SOURCE_TYPE.FILE)
            .with_code("import_file('test.step')")
            .build())
        print("✅ Parametric element created")
        
        # Table element
        table_data = [
            ["Header1", "Header2", "Header3"],
            ["Row1A", "Row1B", "Row1C"],
            ["Row2A", "Row2B", "Row2C"]
        ]
        elements.append(duc.ElementBuilder()
            .at_position(100, 800)
            .with_size(300, 120)
            .with_label("Test Table")
            .with_styles(duc.create_simple_styles())
            .with_z_index(11.0)
            .build_table_from_data()
            .with_data(table_data)
            .build())
        print("✅ Table element created")
        
        # Frame element
        elements.append(duc.ElementBuilder()
            .at_position(700, 800)
            .with_size(150, 100)
            .with_label("Test Frame")
            .with_styles(duc.create_simple_styles())
            .with_z_index(12.0)
            .build_frame_element()
            .build())
        print("✅ Frame element created")
        
        # Plot element
        elements.append(duc.ElementBuilder()
            .at_position(900, 800)
            .with_size(200, 150)
            .with_label("Test Plot")
            .with_styles(duc.create_simple_styles())
            .with_z_index(13.0)
            .build_plot_element()
            .build())
        print("✅ Plot element created")
        
        # Viewport element
        view = duc.DucView(
            scroll_x=0.0,
            scroll_y=0.0,
            zoom=1.0,
            twist_angle=0.0,
            center_point=duc.DucPoint(x=0.0, y=0.0, mirroring=None),
            scope="test"
        )
        elements.append(duc.ElementBuilder()
            .at_position(100, 1000)
            .with_size(200, 150)
            .with_label("Test Viewport")
            .with_styles(duc.create_simple_styles())
            .with_z_index(14.0)
            .build_viewport_element()
            .with_points([(0,0), (200,0), (200,150), (0,150)])
            .with_view(view)
            .with_view_scale(1.0)
            .build())
        print("✅ Viewport element created")
        
        # Doc element
        elements.append(duc.ElementBuilder()
            .at_position(400, 1000)
            .with_size(300, 100)
            .with_label("Test Doc")
            .with_styles(duc.create_simple_styles())
            .with_z_index(15.0)
            .build_doc_element()
            .with_text("This is a rich text document.")
            .build())
        print("✅ Doc element created")
        
        # Linear dimension
        elements.append(duc.ElementBuilder()
            .at_position(50, 1200)
            .with_size(200, 50)
            .with_label("Test Linear Dimension")
            .with_styles(duc.create_simple_styles())
            .with_z_index(16.0)
            .build_linear_dimension()
            .with_origin1((0, 0))
            .with_origin2((200, 0))
            .with_location((100, -20))
            .build())
        print("✅ Linear dimension created")
        
        # Leader element
        elements.append(duc.ElementBuilder()
            .at_position(300, 1200)
            .with_size(50, 50)
            .with_label("Test Leader")
            .with_styles(duc.create_simple_styles())
            .with_z_index(17.0)
            .build_leader_element()
            .with_content_anchor_x(350)
            .with_content_anchor_y(1250)
            .build())
        print("✅ Leader element created")
        
        # Mermaid element
        elements.append(duc.ElementBuilder()
            .at_position(50, 1300)
            .with_size(300, 200)
            .with_label("Test Mermaid")
            .with_styles(duc.create_simple_styles())
            .with_z_index(18.0)
            .build_mermaid_element()
            .with_source("graph TD; A[Start] --> B[End];")
            .with_theme("default")
            .build())
        print("✅ Mermaid element created")
        
        # Embeddable element
        elements.append(duc.ElementBuilder()
            .at_position(400, 1300)
            .with_size(400, 250)
            .with_label("Test Embeddable")
            .with_styles(duc.create_simple_styles())
            .with_z_index(19.0)
            .build_embeddable_element()
            .with_link("https://example.com")
            .build())
        print("✅ Embeddable element created")
        
        # Xray element
        elements.append(duc.ElementBuilder()
            .at_position(50, 1600)
            .with_size(100, 100)
            .with_label("Test Xray")
            .with_styles(duc.create_simple_styles())
            .with_z_index(20.0)
            .build_xray_element()
            .with_origin_x(0.0)
            .with_origin_y(0.0)
            .with_direction_x(1.0)
            .with_direction_y(0.0)
            .with_color("#FF0000")
            .with_start_from_origin(False)
            .build())
        print("✅ Xray element created")
        
        print(f"\n🎉 Successfully created {len(elements)} elements with the builder API!")
        print("✅ All element types tested successfully")
        assert True
        
    except Exception as e:
        print(f"❌ Comprehensive builder test failed: {e}")
        import traceback
        traceback.print_exc()
        pytest.fail(f"Comprehensive builder test failed: {e}")

if __name__ == "__main__":
    success = test_comprehensive_builder_api()
    sys.exit(0 if success else 1) 