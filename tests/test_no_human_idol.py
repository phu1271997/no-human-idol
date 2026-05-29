import unittest
from unittest.mock import MagicMock

# Define a mock SDK skeleton so tests can run locally without the full GenVM environment
class MockAddress:
    def __init__(self, value: str):
        self.value = value
    def __eq__(self, other):
        return isinstance(other, MockAddress) and self.value == other.value
    def __ne__(self, other):
        return not self.__eq__(other)
    def __hash__(self):
        return hash(self.value)
    def __repr__(self):
        return f"Address('{self.value}')"

class MockMessage:
    def __init__(self):
        self.sender_address = MockAddress("0xOrganizer")
        self.value = 0

class MockTreeMap(dict):
    pass

class MockDynArray(list):
    pass

class DecoratorMock:
    def __call__(self, fn):
        return fn

class PublicMock(DecoratorMock):
    def __init__(self):
        self.write = DecoratorMock()
        self.write.payable = DecoratorMock()
        self.view = DecoratorMock()

class EvmMock:
    def __init__(self):
        self.contract_interface = DecoratorMock()

class VmMock:
    def __init__(self):
        self.UserError = Exception
        self.Return = object

# Mocking the genlayer global space
class MockGenLayer:
    def __init__(self):
        self.message = MockMessage()
        self.Contract = object
        self.public = PublicMock()
        self.evm = EvmMock()
        self.vm = VmMock()
        self.Address = MockAddress
        self.TreeMap = MockTreeMap
        self.DynArray = MockDynArray
        self.u256 = int
        self.nondet = MagicMock()

    def get_contract_at(self, addr):
        return MagicMock()

# Inject mock genlayer into modules before loading contract to prevent import crashes
import sys
import types
import builtins
genlayer_mock = MockGenLayer()
sys.modules['genlayer'] = genlayer_mock

# Set gl in builtins so it is globally accessible in all modules (simulating GenVM sandbox)
builtins.gl = genlayer_mock

# Create zero-address mock in local scope
Address = MockAddress
TreeMap = MockTreeMap
DynArray = MockDynArray
u256 = int

# Now import the actual contract code to test deterministic logic
# We mock out the decorators and globals so Python loads it perfectly
import contracts.no_human_idol as no_human_idol

class TestNoHumanIdol(unittest.TestCase):
    def setUp(self):
        # Reset the mock transaction sender to organizer
        genlayer_mock.message.sender_address = Address("0xOrganizer")
        
        # Instantiate contract
        self.contract = no_human_idol.Contract(
            contest_title="GenLayer Creative Writing",
            judging_criteria="Creativity (50%), style (50%)"
        )
        # Manually initialize TreeMap/DynArray fields since GenVM does it at runtime
        self.contract.entrants = DynArray()
        self.contract.entry_url = TreeMap()
        self.contract.entry_title = TreeMap()
        self.contract.entry_score = TreeMap()
        self.contract.entry_reason = TreeMap()
        self.contract.balance = u256(0)

    def test_constructor(self):
        self.assertEqual(self.contract.contest_title, "GenLayer Creative Writing")
        self.assertEqual(self.contract.judging_criteria, "Creativity (50%), style (50%)")
        self.assertEqual(self.contract.organizer, Address("0xOrganizer"))
        self.assertTrue(self.contract.submissions_open)
        self.assertFalse(self.contract.has_judged)
        self.assertEqual(self.contract.winner, Address("0x0000000000000000000000000000000000000000"))
        self.assertEqual(self.contract.winning_score, 0)

    def test_submit(self):
        # Contestant 1 submits
        genlayer_mock.message.sender_address = Address("0xContestant1")
        self.contract.submit("Awesome Story", "https://example.com/story1")
        
        self.assertEqual(len(self.contract.entrants), 1)
        self.assertEqual(self.contract.entrants[0], Address("0xContestant1"))
        self.assertEqual(self.contract.entry_url[Address("0xContestant1")], "https://example.com/story1")
        self.assertEqual(self.contract.entry_title[Address("0xContestant1")], "Awesome Story")

        # Contestant 1 overwrites submission
        self.contract.submit("Awesome Story v2", "https://example.com/story1-v2")
        self.assertEqual(len(self.contract.entrants), 1) # Entrants list shouldn't duplicate
        self.assertEqual(self.contract.entry_url[Address("0xContestant1")], "https://example.com/story1-v2")
        self.assertEqual(self.contract.entry_title[Address("0xContestant1")], "Awesome Story v2")

    def test_close_submissions_only_organizer(self):
        # Non-organizer tries to close
        genlayer_mock.message.sender_address = Address("0xContestant1")
        with self.assertRaises(Exception):
            self.contract.close_submissions()
        
        # Organizer closes
        genlayer_mock.message.sender_address = Address("0xOrganizer")
        self.contract.close_submissions()
        self.assertFalse(self.contract.submissions_open)

        # Cannot submit after closed
        genlayer_mock.message.sender_address = Address("0xContestant2")
        with self.assertRaises(Exception):
            self.contract.submit("My Story", "https://example.com/story2")

    def test_judging_flow(self):
        # Populate entries
        genlayer_mock.message.sender_address = Address("0xContestant1")
        self.contract.submit("Meme 1", "https://meme.com/1")
        genlayer_mock.message.sender_address = Address("0xContestant2")
        self.contract.submit("Meme 2", "https://meme.com/2")
        
        # Organizer closes entries
        genlayer_mock.message.sender_address = Address("0xOrganizer")
        self.contract.close_submissions()

        # Mock the AI score logic
        def mock_score(url):
            if "1" in url:
                return 85, "Great humor and style"
            else:
                return 95, "Absolutely flawless meme"
        self.contract._score = mock_score

        # Execute judging
        self.contract.run_judging()

        # Asserts
        self.assertTrue(self.contract.has_judged)
        self.assertEqual(self.contract.winner, Address("0xContestant2"))
        self.assertEqual(self.contract.winning_score, 95)
        self.assertEqual(self.contract.entry_score[Address("0xContestant1")], 85)
        self.assertEqual(self.contract.entry_score[Address("0xContestant2")], 95)
        self.assertEqual(self.contract.entry_reason[Address("0xContestant2")], "Absolutely flawless meme")

if __name__ == '__main__':
    unittest.main()
