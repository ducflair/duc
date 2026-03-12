use serde::Deserializer;

/// Deserializes an `i32` field from any JSON number, truncating floats instead of erroring.
/// Annotate struct fields with: `#[serde(deserialize_with = "crate::serde_utils::trunc_i32")]`
pub fn trunc_i32<'de, D>(deserializer: D) -> Result<i32, D::Error>
where
    D: Deserializer<'de>,
{
    struct Visitor;

    impl<'de> serde::de::Visitor<'de> for Visitor {
        type Value = i32;

        fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.write_str("integer or float representable as i32")
        }

        fn visit_i8<E: serde::de::Error>(self, v: i8) -> Result<i32, E> {
            Ok(v as i32)
        }
        fn visit_i16<E: serde::de::Error>(self, v: i16) -> Result<i32, E> {
            Ok(v as i32)
        }
        fn visit_i32<E: serde::de::Error>(self, v: i32) -> Result<i32, E> {
            Ok(v)
        }
        fn visit_i64<E: serde::de::Error>(self, v: i64) -> Result<i32, E> {
            i32::try_from(v).map_err(E::custom)
        }
        fn visit_u8<E: serde::de::Error>(self, v: u8) -> Result<i32, E> {
            Ok(v as i32)
        }
        fn visit_u16<E: serde::de::Error>(self, v: u16) -> Result<i32, E> {
            Ok(v as i32)
        }
        fn visit_u32<E: serde::de::Error>(self, v: u32) -> Result<i32, E> {
            i32::try_from(v).map_err(E::custom)
        }
        fn visit_u64<E: serde::de::Error>(self, v: u64) -> Result<i32, E> {
            i32::try_from(v).map_err(E::custom)
        }
        fn visit_f32<E: serde::de::Error>(self, v: f32) -> Result<i32, E> {
            Ok(v.trunc() as i32)
        }
        fn visit_f64<E: serde::de::Error>(self, v: f64) -> Result<i32, E> {
            Ok(v.trunc() as i32)
        }
    }

    deserializer.deserialize_any(Visitor)
}

struct FlexI32Seed;

impl<'de> serde::de::DeserializeSeed<'de> for FlexI32Seed {
    type Value = i32;
    fn deserialize<D: Deserializer<'de>>(self, deserializer: D) -> Result<i32, D::Error> {
        trunc_i32(deserializer)
    }
}

/// Deserializes a `Vec<i32>` from a JSON array of numbers, truncating any floats.
/// Annotate struct fields with: `#[serde(deserialize_with = "crate::serde_utils::trunc_vec_i32")]`
pub fn trunc_vec_i32<'de, D>(deserializer: D) -> Result<Vec<i32>, D::Error>
where
    D: Deserializer<'de>,
{
    struct SeqVisitor;

    impl<'de> serde::de::Visitor<'de> for SeqVisitor {
        type Value = Vec<i32>;

        fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.write_str("a sequence of integers or floats representable as i32")
        }

        fn visit_seq<A>(self, mut seq: A) -> Result<Vec<i32>, A::Error>
        where
            A: serde::de::SeqAccess<'de>,
        {
            let mut v = Vec::with_capacity(seq.size_hint().unwrap_or(0));
            while let Some(n) = seq.next_element_seed(FlexI32Seed)? {
                v.push(n);
            }
            Ok(v)
        }
    }

    deserializer.deserialize_seq(SeqVisitor)
}
