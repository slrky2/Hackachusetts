# Requirements Document

## Introduction

The `/chatbot` page (reached from the "Chat" item in the shared City Land header) currently shows a single centered `max-w-3xl` "CivicBot" card containing the AI chat. This feature turns that page into a Discord-style two-pane layout below the unchanged `SiteHeader`: a left sidebar listing community channels (`#general`, `#new-food-places`, and a few others) plus a `#chatbot` channel for the AI assistant, and a right pane showing the selected channel.

`#chatbot` renders the existing `ChatInterface` with its current behavior. Community channels are a proof of concept: the app has no database and no authentication, so community channels show seeded messages labeled as demo/fictional (following the demo data rules in `my-app/data/Lowell.md`, Section 9), and messages a visitor posts are held in browser memory only.

Context only (not a requirement): the screenshot provided shows a blue user bubble and Send button in the AI chat. The source in `my-app/components/chatbot/ChatInterface.tsx` already uses emerald styling (no `blue-` classes remain), so the browser was likely showing stale hot-reload state. A hard refresh should show the emerald styling.

The page keeps the homepage visual language: emerald/teal palette, `rounded-2xl` cards with `border-black/5` / `dark:border-white/10`, `text-lg font-bold` headings, emerald pills, and dark mode support.

### Confirmed decisions

- **Channel URLs:** the selected channel is addressable with a query parameter on the existing route, e.g. `/chatbot?channel=general`, so links and page refresh keep the selection.
- **Default channel:** `/chatbot` with no channel parameter (or an unknown one) opens `#chatbot`, because "Chat" previously meant the AI assistant.
- **Posted message persistence:** visitor-posted messages live in client memory for the current page session, survive switching channels, and are lost on reload. No `localStorage` persistence.
- **Channel list:** Community channels `#general`, `#new-food-places`, `#events`, `#lost-and-found`, `#road-reports`, plus the Assistant channel `#chatbot`. A city-alerts channel is excluded because demo content must not imply official City of Lowell announcements.
- **Out of scope:** real-time messaging, server persistence, authentication, moderation, creating/editing/deleting channels, editing/deleting messages, and unread counts. The existing `(dashboard)/channels` stub routes, `components/channels/*` scaffolding, and `/api/channels` route are left unchanged; reusing those components is a design decision.

## Glossary

- **Channels_Page**: The page rendered at the `/chatbot` route, consisting of the Site_Header, the Channel_Sidebar, and the Channel_Pane.
- **Site_Header**: The existing shared `SiteHeader` server component in `my-app/components/layout/SiteHeader.tsx`, rendered with `active="chat"` on the Channels_Page.
- **Channel_Sidebar**: The navigation region of the Channels_Page that lists all Channels grouped under Channel_Groups.
- **Channel_Pane**: The region of the Channels_Page that displays the content of the Selected_Channel.
- **Channel**: A named conversation space identified by a Channel_Slug and displayed as `#` followed by the Channel_Slug.
- **Channel_Slug**: A lowercase, hyphen-separated identifier for a Channel (e.g. `general`, `new-food-places`, `chatbot`).
- **Channel_Group**: A labeled section of the Channel_Sidebar. The two groups are "Community" and "Assistant".
- **Community_Channel**: A Channel in the "Community" Channel_Group that shows Demo_Messages and Session_Messages.
- **Chatbot_Channel**: The Channel with Channel_Slug `chatbot`, in the "Assistant" Channel_Group, whose Channel_Pane renders the Chat_Interface.
- **Selected_Channel**: The Channel currently displayed in the Channel_Pane.
- **Channel_Parameter**: The `channel` URL query parameter on the `/chatbot` route whose value is a Channel_Slug.
- **Chat_Interface**: The existing `ChatInterface` client component in `my-app/components/chatbot/ChatInterface.tsx` that sends `{message, history}` to `POST /api/chatbot` and renders Markdown replies.
- **Demo_Message**: A seeded, fictional message bundled with the app for a Community_Channel, used for UI demonstration only.
- **Demo_Label**: A visible text marker reading "DEMO / FICTIONAL" that identifies Demo_Messages.
- **Session_Message**: A message posted by the visitor into a Community_Channel and held in browser memory for the current page session.
- **Message_Composer**: The text input and Send button shown at the bottom of a Community_Channel's Channel_Pane.
- **Visitor_Display_Name**: The placeholder author name "You" shown on Session_Messages, used because the app has no authentication.
- **Narrow_Viewport**: A browser viewport narrower than 768 CSS pixels (below the Tailwind `md` breakpoint).
- **Wide_Viewport**: A browser viewport 768 CSS pixels wide or wider.

## Requirements

### Requirement 1: Two-pane channels layout

**User Story:** As a Lowell resident, I want the Chat page to show a channel list on the left and the selected channel on the right, so that I can move between community conversations and the AI assistant in one place.

#### Acceptance Criteria

1. THE Channels_Page SHALL render the Site_Header with the "Chat" navigation item marked active above the Channel_Sidebar and the Channel_Pane.
2. WHILE the Channels_Page is displayed in a Wide_Viewport, THE Channels_Page SHALL display the Channel_Sidebar on the left and the Channel_Pane on the right, side by side, filling the viewport height below the Site_Header.
3. WHILE the Channels_Page is displayed in a Narrow_Viewport, THE Channels_Page SHALL display the Channel_Sidebar above the Channel_Pane with the Channel_Pane occupying the remaining viewport height below the Site_Header and the Channel_Sidebar.
4. WHILE the Channels_Page is displayed in a Narrow_Viewport, THE Channel_Sidebar SHALL make every Channel reachable by scrolling or tapping within a region no taller than 25% of the viewport height.
5. THE Channels_Page SHALL use the homepage visual language: the emerald gradient page background, `rounded-2xl` surfaces with `border-black/5` borders in light mode and `border-white/10` borders in dark mode, and emerald accent colors.
6. WHILE the operating system color scheme is dark, THE Channels_Page SHALL render the Channel_Sidebar and Channel_Pane with the dark-mode surface and text colors used by the homepage.
7. WHEN the Channel_Pane content is taller than the Channel_Pane, THE Channel_Pane SHALL scroll the content within the Channel_Pane while the Site_Header and Channel_Sidebar stay in place.

### Requirement 2: Channel list contents and grouping

**User Story:** As a Lowell resident, I want a Discord-like list of named community channels and a clearly marked AI channel, so that I can find the conversation I want at a glance.

#### Acceptance Criteria

1. THE Channel_Sidebar SHALL display a "Community" Channel_Group containing, in this order, the Community_Channels `#general`, `#new-food-places`, `#events`, `#lost-and-found`, and `#road-reports`.
2. THE Channel_Sidebar SHALL display an "Assistant" Channel_Group containing the Chatbot_Channel `#chatbot`.
3. THE Channel_Sidebar SHALL display each Channel as the `#` character followed by the Channel_Slug.
4. THE Channel_Sidebar SHALL display a bot icon and an "AI" pill next to the `#chatbot` entry to distinguish the Chatbot_Channel from Community_Channels.
5. THE Channel_Sidebar SHALL display a heading identifying the community as Lowell, MA, using the configured default city value.
6. WHILE a Channel is the Selected_Channel, THE Channel_Sidebar SHALL display the entry for that Channel with an emerald highlighted background that differs from the unselected entries.

### Requirement 3: Channel selection and URL addressing

**User Story:** As a Lowell resident, I want each channel to have its own link, so that refreshing the page or sharing a link opens the same channel.

#### Acceptance Criteria

1. WHEN the visitor activates a Channel entry in the Channel_Sidebar, THE Channels_Page SHALL make that Channel the Selected_Channel and set the Channel_Parameter in the browser URL to that Channel's Channel_Slug.
2. WHEN the Channels_Page is loaded with a Channel_Parameter matching a Channel_Slug, THE Channels_Page SHALL display that Channel as the Selected_Channel.
3. WHEN the Channels_Page is loaded without a Channel_Parameter, THE Channels_Page SHALL display the Chatbot_Channel as the Selected_Channel.
4. IF the Channels_Page is loaded with a Channel_Parameter that matches no Channel_Slug, THEN THE Channels_Page SHALL display the Chatbot_Channel as the Selected_Channel.
5. WHEN the visitor uses the browser back or forward action after changing channels, THE Channels_Page SHALL display the Channel identified by the resulting Channel_Parameter as the Selected_Channel.
6. WHEN the Selected_Channel changes, THE Channel_Pane SHALL display a header showing the Selected_Channel name and a one-line description of that Channel.
7. THE Site_Header "Chat" navigation item SHALL continue to link to `/chatbot`.

### Requirement 4: Chatbot channel

**User Story:** As a Lowell resident, I want the `#chatbot` channel to contain the existing AI assistant, so that I can keep asking CivicBot questions from the new layout.

#### Acceptance Criteria

1. WHILE the Chatbot_Channel is the Selected_Channel, THE Channel_Pane SHALL render the Chat_Interface.
2. WHILE the Chatbot_Channel is the Selected_Channel, THE Channel_Pane header SHALL display the name "CivicBot", the "AI" pill, and an emerald pill showing the configured default city value.
3. THE Chat_Interface SHALL keep the existing behavior: sending `{message, history}` to `POST /api/chatbot`, rendering assistant replies as Markdown, showing loading and error states, and sending on Enter.
4. WHEN the visitor switches from the Chatbot_Channel to a Community_Channel and back within the same page session, THE Chat_Interface SHALL display the conversation messages exchanged before the switch.

### Requirement 5: Community channel messages

**User Story:** As a Lowell resident, I want community channels to show example conversations, so that I can see how the community chat works even without a live backend.

#### Acceptance Criteria

1. WHILE a Community_Channel is the Selected_Channel, THE Channel_Pane SHALL display that Channel's Demo_Messages followed by that Channel's Session_Messages in chronological order.
2. THE Channels_Page SHALL provide at least 3 Demo_Messages for each Community_Channel.
3. THE Channel_Pane SHALL display each message with an author display name, an avatar showing the author's initial, a relative or formatted timestamp, and the message text.
4. WHILE a Community_Channel is the Selected_Channel, THE Channel_Pane SHALL display a Demo_Label banner stating that the messages are fictional sample content and are not from the City of Lowell.
5. THE Channels_Page SHALL use fictional author names, fictional or generic location labels, and wording that states or implies no current real emergency, closure, or official City of Lowell announcement in every Demo_Message.
6. WHEN the Selected_Channel changes to a Community_Channel or a new message is added to the Selected_Channel, THE Channel_Pane SHALL scroll to show the most recent message.

### Requirement 6: Posting messages in community channels

**User Story:** As a Lowell resident, I want to type a message into a community channel, so that I can try out participating in the conversation.

#### Acceptance Criteria

1. WHILE a Community_Channel is the Selected_Channel, THE Channel_Pane SHALL display the Message_Composer with a placeholder reading "Message #" followed by the Channel_Slug.
2. WHEN the visitor submits non-empty text in the Message_Composer by pressing Enter or activating the Send button, THE Channels_Page SHALL append a Session_Message with that text, the Visitor_Display_Name, and the current time to the Selected_Channel and clear the Message_Composer.
3. WHEN the visitor presses Shift+Enter in the Message_Composer, THE Message_Composer SHALL insert a line break without submitting.
4. IF the Message_Composer text is empty or contains only whitespace, THEN THE Message_Composer SHALL disable the Send button and ignore Enter submissions.
5. THE Message_Composer SHALL limit message text to 1000 characters.
6. WHEN the visitor switches to another Channel and back within the same page session, THE Channel_Pane SHALL display the Session_Messages previously posted in that Channel.
7. THE Channels_Page SHALL hold Session_Messages in browser memory only and SHALL send Session_Messages to no server endpoint.
8. THE Channel_Pane SHALL render Session_Message text as plain text with whitespace line breaks preserved.

### Requirement 7: Accessibility

**User Story:** As a resident using a keyboard or screen reader, I want the channel list and messages to be navigable and announced correctly, so that I can use every channel.

#### Acceptance Criteria

1. THE Channel_Sidebar SHALL be a `nav` landmark with the accessible name "Channels".
2. THE Channel_Sidebar SHALL render each Channel_Group label as a heading and each Channel entry as a link reachable with the Tab key.
3. WHILE a Channel is the Selected_Channel, THE Channel_Sidebar SHALL set `aria-current="page"` on that Channel's entry and on no other entry.
4. THE Channel_Sidebar SHALL display a visible emerald focus indicator on the Channel entry that has keyboard focus.
5. THE Channel_Pane message list SHALL be exposed as a log region (`role="log"`) so that newly added messages are announced to assistive technology.
6. THE Message_Composer text input SHALL have an accessible label naming the Selected_Channel.
7. THE bot icon on the `#chatbot` entry SHALL be hidden from assistive technology, and the "AI" pill text SHALL be included in the entry's accessible name.
8. THE Channels_Page SHALL meet WCAG 2.1 AA color contrast for channel names, message text, and the Demo_Label in both light and dark color schemes.

### Requirement 8: Preserved behavior and build

**User Story:** As a developer on the team, I want this change confined to the Chat page, so that the rest of the app and the chatbot backend keep working.

#### Acceptance Criteria

1. THE Site_Header component and the homepage SHALL keep their current markup and behavior.
2. THE `/api/chatbot` route and the `my-app/data/Lowell.md` knowledge base SHALL keep their current content and behavior.
3. THE `(dashboard)` routes, the `/api/channels` route, and the existing `components/channels` files SHALL keep their current behavior.
4. WHEN `npm run build` is run in `my-app/`, THE build SHALL complete with no errors with Cache Components enabled.
5. WHEN `npm run lint` is run in `my-app/`, THE linter SHALL report no new errors in files changed by this feature.
