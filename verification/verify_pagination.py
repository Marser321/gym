
from playwright.sync_api import sync_playwright, Route
import json
import time

def handle_messages_route(route: Route):
    request = route.request
    url = request.url
    # print(f"Intercepted: {url}")

    range_header = request.headers.get("range") or request.headers.get("Range")
    # print(f"Range Header: {range_header}")

    start = 0
    end = 49
    if range_header:
        parts = range_header.split("-")
        if len(parts) == 2:
            try:
                start = int(parts[0])
                end = int(parts[1])
            except:
                pass

    print(f"Handling request for messages range: {start}-{end}")

    messages = []
    # Simulate DB returning "latest" messages first (descending id/created_at)
    for i in range(start, end + 1):
        msg_id = 10000 - i
        # Simple date decrement
        messages.append({
            "id": str(msg_id),
            "sender_id": "user1" if i % 2 == 0 else "user2",
            "receiver_id": "user2" if i % 2 == 0 else "user1",
            "content": f"Message #{msg_id} (Index {i})",
            "created_at": "2023-01-01T12:00:00Z",
            "is_read": True
        })

    response_headers = {
        "content-type": "application/json",
        "content-range": f"{start}-{end}/10000"
    }

    route.fulfill(
        status=200,
        headers=response_headers,
        body=json.dumps(messages)
    )

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock Supabase
    page.route("**/rest/v1/messages*", handle_messages_route)

    page.on("console", lambda msg: print(f"Console: {msg.text}"))

    print("Navigating to test page...")
    page.goto("http://localhost:3000/test-chat")

    print("Waiting for initial messages...")
    # Should see Message #10000
    page.wait_for_selector("text=Message #10000")

    print("Taking initial screenshot...")
    page.screenshot(path="/home/jules/verification/chat_initial.png")

    print("Scrolling to top...")
    # Scroll container
    page.evaluate("""
        const container = document.querySelector('.overflow-y-auto');
        if (container) {
            container.scrollTop = 0;
        } else {
            console.error("Scroll container not found");
        }
    """)

    print("Waiting for older messages (next page)...")
    # Next page starts at index 50 -> Message #9950
    # Wait for it to appear
    try:
        page.wait_for_selector("text=Message #9950", timeout=5000)
        print("Found older message!")
    except Exception as e:
        print(f"Error waiting for older message: {e}")
        page.screenshot(path="/home/jules/verification/chat_error.png")
        raise e

    print("Taking scrolled screenshot...")
    page.screenshot(path="/home/jules/verification/chat_scrolled.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run(p)
