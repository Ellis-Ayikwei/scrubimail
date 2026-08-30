"""Password signup: the payload the SPA actually sends must land on the User.

The signup form posts a single display name (this User model has no `username`
— USERNAME_FIELD is email) and `confirm_password`; both used to be dropped, so
password accounts ended up nameless while OAuth accounts got names from the
provider.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.Authentication.views import RegisterView, normalize_register_payload

User = get_user_model()


class NormalizeRegisterPayloadTests(TestCase):
    def test_confirm_password_maps_to_password2(self):
        data = normalize_register_payload({"confirm_password": "s3cret"})
        self.assertEqual(data["password2"], "s3cret")

    def test_display_name_is_split_into_first_and_last(self):
        data = normalize_register_payload({"username": "Ada Lovelace"})
        self.assertEqual(data["first_name"], "Ada")
        self.assertEqual(data["last_name"], "Lovelace")
        self.assertNotIn("username", data)

    def test_multi_word_surname_is_kept_whole(self):
        data = normalize_register_payload({"name": "Ada van der Lovelace"})
        self.assertEqual(data["first_name"], "Ada")
        self.assertEqual(data["last_name"], "van der Lovelace")

    def test_single_word_name_leaves_last_name_blank(self):
        data = normalize_register_payload({"full_name": "Ada"})
        self.assertEqual(data["first_name"], "Ada")
        self.assertEqual(data["last_name"], "")

    def test_explicit_names_are_not_overwritten(self):
        data = normalize_register_payload(
            {"first_name": "Grace", "last_name": "Hopper", "username": "Ada Lovelace"}
        )
        self.assertEqual(data["first_name"], "Grace")
        self.assertEqual(data["last_name"], "Hopper")


class RegisterViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def _register(self, payload):
        request = self.factory.post("/auth/register/", payload, format="json")
        return RegisterView.as_view()(request)

    def test_signup_persists_the_name_from_the_form(self):
        response = self._register(
            {
                "email": "ada@example.com",
                "username": "Ada Lovelace",
                "password": "corr3ct-horse-b@ttery",
                "confirm_password": "corr3ct-horse-b@ttery",
            }
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email="ada@example.com")
        self.assertEqual(user.first_name, "Ada")
        self.assertEqual(user.last_name, "Lovelace")

    def test_response_does_not_promise_a_verification_email(self):
        """No verification mail is sent and there is no confirm endpoint, so the
        success copy must not tell users to go check their inbox."""
        response = self._register(
            {
                "email": "grace@example.com",
                "password": "corr3ct-horse-b@ttery",
                "confirm_password": "corr3ct-horse-b@ttery",
            }
        )
        self.assertEqual(response.status_code, 201)
        self.assertNotIn("verification", response.data["message"].lower())

    def test_mismatched_passwords_rejected(self):
        response = self._register(
            {
                "email": "mismatch@example.com",
                "password": "corr3ct-horse-b@ttery",
                "confirm_password": "something-else-1A",
            }
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email="mismatch@example.com").exists())
