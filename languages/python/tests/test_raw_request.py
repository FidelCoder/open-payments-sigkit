"""Tests for raw HTTP request parsing."""

import unittest

from open_payments_http_signatures_devkit.raw_request import parse_raw_http_request


class TestParseRawHttpRequest(unittest.TestCase):
    def test_basic_post_request(self):
        raw = (
            "POST /quotes HTTP/1.1\r\n"
            "Host: rs.example.com\r\n"
            "Content-Type: application/json\r\n"
            'Authorization: GNAP access_token="token"\r\n'
            "\r\n"
            '{"receiver":"https://wallet.example.com/bob"}'
        )

        result = parse_raw_http_request(raw)

        self.assertEqual(result.method, "POST")
        self.assertEqual(result.url, "https://rs.example.com/quotes")
        self.assertEqual(result.headers["content-type"], "application/json")
        self.assertEqual(result.headers["authorization"], 'GNAP access_token="token"')
        self.assertEqual(result.body, '{"receiver":"https://wallet.example.com/bob"}')

    def test_get_request_without_body(self):
        raw = (
            "GET /incoming-payments HTTP/1.1\r\n"
            "Host: rs.example.com\r\n"
            'Authorization: GNAP access_token="token"\r\n'
        )

        result = parse_raw_http_request(raw)

        self.assertEqual(result.method, "GET")
        self.assertEqual(result.url, "https://rs.example.com/incoming-payments")
        self.assertIsNone(result.body)

    def test_absolute_url_in_request_line(self):
        raw = (
            "POST https://rs.example.com/quotes HTTP/1.1\r\n"
            "Content-Type: application/json\r\n"
            "\r\n"
            '{"hello":"world"}'
        )

        result = parse_raw_http_request(raw)

        self.assertEqual(result.url, "https://rs.example.com/quotes")

    def test_custom_default_scheme(self):
        raw = (
            "GET /test HTTP/1.1\r\n"
            "Host: example.com\r\n"
        )

        result = parse_raw_http_request(raw, default_scheme="http")

        self.assertEqual(result.url, "http://example.com/test")

    def test_continuation_line(self):
        raw = (
            "GET /test HTTP/1.1\r\n"
            "Host: example.com\r\n"
            "X-Long-Header: first-part\r\n"
            "  second-part\r\n"
        )

        result = parse_raw_http_request(raw)

        self.assertEqual(result.headers["x-long-header"], "first-part second-part")

    def test_duplicate_headers_combined(self):
        raw = (
            "GET /test HTTP/1.1\r\n"
            "Host: example.com\r\n"
            "Accept: text/html\r\n"
            "Accept: application/json\r\n"
        )

        result = parse_raw_http_request(raw)

        self.assertEqual(result.headers["accept"], "text/html, application/json")

    def test_empty_input_raises(self):
        with self.assertRaises(ValueError):
            parse_raw_http_request("")

    def test_missing_request_line_raises(self):
        with self.assertRaises(ValueError):
            parse_raw_http_request("   \n  ")

    def test_malformed_request_line_raises(self):
        with self.assertRaises(ValueError):
            parse_raw_http_request("INVALID")

    def test_missing_host_for_relative_url_raises(self):
        with self.assertRaises(ValueError):
            parse_raw_http_request("GET /path HTTP/1.1\r\n\r\n")

    def test_lf_line_endings(self):
        raw = (
            "POST /quotes HTTP/1.1\n"
            "Host: rs.example.com\n"
            "Content-Type: application/json\n"
            "\n"
            '{"hello":"world"}'
        )

        result = parse_raw_http_request(raw)

        self.assertEqual(result.method, "POST")
        self.assertEqual(result.body, '{"hello":"world"}')


if __name__ == "__main__":
    unittest.main()
