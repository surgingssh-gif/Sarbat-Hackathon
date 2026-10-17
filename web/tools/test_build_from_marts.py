import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("build_from_marts.py")
SPEC = importlib.util.spec_from_file_location("build_from_marts", MODULE_PATH)
build = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(build)


class BooleanParsingTests(unittest.TestCase):
    def test_accepts_sheet_and_numeric_boolean_encodings(self):
        for value in ("TRUE", "true", "T", "yes", "Y", "1", "1.0"):
            self.assertIs(build.flag({"service": value}, "service"), True)
        for value in ("FALSE", "false", "F", "no", "N", "0", "0.0"):
            self.assertIs(build.flag({"service": value}, "service"), False)

    def test_blank_is_unknown_not_false(self):
        self.assertIsNone(build.flag({"service": ""}, "service"))
        self.assertEqual(build.csv_flag(None), "")

    def test_rejects_unexpected_values(self):
        with self.assertRaisesRegex(ValueError, "Unexpected boolean value"):
            build.flag({"service": "available"}, "service")

    def test_composite_service_preserves_null(self):
        self.assertIs(build.any_flag({"a": "0", "b": "1"}, "a", "b"), True)
        self.assertIs(build.any_flag({"a": "0", "b": "0"}, "a", "b"), False)
        self.assertIsNone(build.any_flag({"a": "0", "b": ""}, "a", "b"))


if __name__ == "__main__":
    unittest.main()
