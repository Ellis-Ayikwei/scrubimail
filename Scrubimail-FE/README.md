# React TypeScript Technical Documentation

Project Overview

This documentation describes the Alumni Portal Frontend, 
a web application for managing policies bought by alumni groups. 
The application allows users to create, view, update, 
and delete various resources essential for managing alumni-related activities. 
The system is undergoing further refactoring and typing enhancements 
to ensure optimal performance and maintainability.


## Getting Started

**Alumni Portal Frontend** is a web application that facilitates the management of policies and resources associated with alumni groups.

---

## Key Features

The system allows for the creation, deletion, updating, and viewing of the following resources:

- `alumni_groups`
- `amendments`
- `attachments`
- `audit_trails`
- `beneficiaries`
- `benefits`
- `contract_members`
- `contracts`
- `group_members`
- `insurance_packages`
- `invites`
- `invoices`
- `payment_methods`
- `payments`
- `users`

---

## Technologies Used

- **React**: Frontend library for building user interfaces.
- **TypeScript**: For static typing and improved developer experience.
- **Redux**: For state management.
- **Axios**: For API integration.
- **React Auth Kit**: Middleware for authentication and token validation.
- **Tailwind CSS**: For styling.

---

## Setup and Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Ellis-Ayikwei/alumni-portal-FE.git
    ```
2. Navigate to the project directory:
    ```bash
    cd alumni-portal-FE
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Start the development server:
    ```bash
    npm run dev
    ```
5. Open your browser and navigate to `http://localhost:3000`.

---

## Available Scripts

Check the `package.json` file for available scripts such as `start`, `build`, `test`, and `lint`.

---

## State Management

State management uses Redux and asynchronous requests are handled with Redux Thunks. Below is an example of token handling with Axios instances and interceptors:

```typescript
const authAxiosInstance = axios.create({
    baseURL: authApiUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

authAxiosInstance.interceptors.request.use(
    (config) => {
        const token = getCookie('_auth');
        config.headers.Authorization = token ?? '';
        config.headers['X-Refresh-Token'] = getCookie('_auth_refresh') ?? '';

        if (!config.data) {
            config.data = {
                user_id: localStorage.getItem('userId') ?? 'default_user_id',
            };
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default authAxiosInstance;

const refreshTokens = async (): Promise<{ accessToken: string; refreshToken: string }> => {
    try {
        const response = await authAxiosInstance.post('/refresh_token');
        const accessToken = response.headers['authorization']?.split(' ')[1];
        const refreshToken = response.headers['x-refresh-token'];
        return { accessToken, refreshToken };
    } catch (err) {
        throw new Error('Token refresh failed');
    }
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response.status === 401) {
            try {
                const { accessToken, refreshToken } = await refreshTokens();
                const signIn = useSignIn();
                signIn({
                    auth: {
                        token: accessToken,
                        type: 'Bearer',
                    },
                    refresh: refreshToken,
                });

                // Retry the original request
                error.config.headers['Authorization'] = `Bearer ${accessToken}`;
                return await authAxiosInstance.request(error.config);
            } catch (refreshError) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
```

---

## API Integration

API integration is managed with Axios instances and includes token validation and refresh logic. Below is an example of a login flow:

```typescript
export const LoginUser = createAsyncThunk(
    'auth/LoginUser',
    async ({ userOrEmail, password, extra }: { userOrEmail: { email?: string; username?: string }; password: string; extra?: any }, { rejectWithValue }) => {
        try {
            const response = await authAxiosInstance.post('/login', { ...userOrEmail, password });

            const accessToken = response.headers['authorization'];
            const refreshToken = response.headers['x-refresh-token'];
            const user = response.data;

            if (!accessToken || !refreshToken) {
                throw new Error('Invalid token response from server');
            }

            const { signIn } = extra;
            signIn({
                auth: {
                    token: accessToken,
                    type: 'Bearer',
                },
                refresh: refreshToken,
                userState: user,
            });

            localStorage.setItem('userId', user?.id);

            return user;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);
```

---

Ensure all critical components and API integrations are covered in test cases.

---

This documentation provides a comprehensive overview of the Alumni Portal Frontend. For further assistance, refer to the project repository.

## Using Your API Key for Authentication

To authenticate with the Scrubimail API, include your API key in the request headers. You can use either of the following headers:

- `Authorization: Api-Key <your-api-key>` (recommended)
- `X-API-Key: <your-api-key>`

### Example Requests in Different Languages

#### curl
```sh
curl -X POST https://yourdomain.com/scrubi/api/v1/validate/ \
  -H "Authorization: Api-Key sk_test_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "real_time": true}'
```

#### Python (requests)
```python
import requests
headers = {
    "Authorization": "Api-Key sk_test_1234567890abcdef",
    "Content-Type": "application/json"
}
data = {"email": "test@example.com", "real_time": True}
response = requests.post("https://yourdomain.com/scrubi/api/v1/validate/", json=data, headers=headers)
print(response.json())
```

#### JavaScript (fetch)
```js
fetch("https://yourdomain.com/scrubi/api/v1/validate/", {
  method: "POST",
  headers: {
    "Authorization": "Api-Key sk_test_1234567890abcdef",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ email: "test@example.com", real_time: true })
})
  .then(res => res.json())
  .then(console.log);
```

#### Node.js (axios)
```js
const axios = require('axios');
axios.post(
  'https://yourdomain.com/scrubi/api/v1/validate/',
  { email: 'test@example.com', real_time: true },
  {
    headers: {
      'Authorization': 'Api-Key sk_test_1234567890abcdef',
      'Content-Type': 'application/json'
    }
  }
).then(res => console.log(res.data));
```

#### Java (HttpURLConnection)
```java
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

URL url = new URL("https://yourdomain.com/scrubi/api/v1/validate/");
HttpURLConnection conn = (HttpURLConnection) url.openConnection();
conn.setRequestMethod("POST");
conn.setRequestProperty("Authorization", "Api-Key sk_test_1234567890abcdef");
conn.setRequestProperty("Content-Type", "application/json");
conn.setDoOutput(true);
String jsonInputString = "{\"email\": \"test@example.com\", \"real_time\": true}";
try(OutputStream os = conn.getOutputStream()) {
    byte[] input = jsonInputString.getBytes("utf-8");
    os.write(input, 0, input.length);
}
// Read response...
```

#### Go
```go
package main
import (
    "bytes"
    "fmt"
    "net/http"
)
func main() {
    url := "https://yourdomain.com/scrubi/api/v1/validate/"
    jsonStr := []byte(`{"email": "test@example.com", "real_time": true}`)
    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonStr))
    req.Header.Set("Authorization", "Api-Key sk_test_1234567890abcdef")
    req.Header.Set("Content-Type", "application/json")
    client := &http.Client{}
    resp, _ := client.Do(req)
    fmt.Println(resp.Status)
}
```

#### PHP (cURL)
```php
$ch = curl_init('https://yourdomain.com/scrubi/api/v1/validate/');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Api-Key sk_test_1234567890abcdef',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'test@example.com',
    'real_time' => true
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
```

#### Ruby
```ruby
require 'net/http'
require 'uri'
require 'json'
uri = URI.parse("https://yourdomain.com/scrubi/api/v1/validate/")
request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Api-Key sk_test_1234567890abcdef"
request["Content-Type"] = "application/json"
request.body = { email: "test@example.com", real_time: true }.to_json
response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end
puts response.body
```

#### C# (HttpClient)
```csharp
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization", "Api-Key sk_test_1234567890abcdef");
var content = new StringContent("{\"email\":\"test@example.com\",\"real_time\":true}", Encoding.UTF8, "application/json");
var response = await client.PostAsync("https://yourdomain.com/scrubi/api/v1/validate/", content);
string responseString = await response.Content.ReadAsStringAsync();
System.Console.WriteLine(responseString);
```

---

Replace `<your-api-key>` with your actual API key. You can use either header in any language. If you have questions or need more examples, contact support.