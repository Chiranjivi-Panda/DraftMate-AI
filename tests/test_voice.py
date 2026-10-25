import unittest
from voice.intent_parser import parse_intent, IntentType
from voice.confirm_gate import ConfirmGate


class VoiceTests(unittest.TestCase):
    def test_verify(self):
        i = parse_intent("verify citations")
        self.assertEqual(i.type, IntentType.VERIFY)
        self.assertGreater(i.confidence, 0.8)

    def test_export(self):
        i = parse_intent("export as PDF")
        self.assertEqual(i.type, IntentType.EXPORT)
        self.assertEqual(i.slots.get("format"), "PDF")

    def test_edit_requires_confirm(self):
        i = parse_intent("edit the text to be shorter")
        self.assertEqual(i.type, IntentType.EDIT)
        self.assertTrue(i.requires_confirmation)

    def test_gate_flow(self):
        g = ConfirmGate()
        r = g.process_utterance("edit the intro")
        self.assertEqual(r["state"], "awaiting_confirm")
        r2 = g.process_utterance("confirm")
        self.assertEqual(r2["state"], "executed")

    def test_help(self):
        g = ConfirmGate()
        r = g.process_utterance("help")
        self.assertEqual(r["state"], "help")
        self.assertIn("verify", r["speech"].lower())


if __name__ == "__main__":
    unittest.main()
