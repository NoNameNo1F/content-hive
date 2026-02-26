# Project Requirements

## Functional Requirements

### Authentication & Users
- [ ] User registration and login (email/password + OAuth optional)
- [ ] User onboarding: select 3–5 interest tags on first login
- [ ] Role system: `visitor`, `member`, `admin`
- [ ] User profile page showing saved/bookmarked content ("their face")

### Content Management
- [ ] Create content post with type: `video`, `link`, `text`
- [ ] Each post includes: title, description, URL (if applicable), tags, category, visibility (`public` | `team`)
- [ ] Auto-fetch Open Graph metadata for links (title, thumbnail, description)
- [ ] Edit and delete own posts
- [ ] Admin can moderate (hide/delete) any post

### Organization
- [ ] Tag system — free-form tags on each post (multi-tag support)
- [ ] Category system — predefined by admin, assigned to posts
- [ ] Filter content by tag, category, content type, and visibility

### Search
- [ ] Full-text search across title, description, tags
- [ ] Search results ranked by relevance
- [ ] Search works for both public and team content (scoped by user role)

### Feed & Discovery
- [ ] Homepage feed shows content matching user's stated interests (tag-based matching)
- [ ] Feed sorted by recency (default), with option to sort by popularity (saves count)
- [ ] Public feed visible to non-authenticated visitors (public content only)

### Save / Bookmark
- [ ] Authenticated users can save/bookmark any post
- [ ] Saved posts appear on user's profile ("their face")
- [ ] Unsave/remove bookmark

### Visibility & Permissions
- [ ] Content visibility: `public` (anyone) or `team` (authenticated members only)
- [ ] Visitors can only see `public` content
- [ ] Team members can see all content
- [ ] Admin can manage all content and users

### Notifications (V2)
- [ ] Notify user when new content is added matching their interests
- [ ] In-app notification bell
- [ ] Email digest (weekly) — optional

### Mobile (V2)
- [ ] Responsive design — fully usable on mobile browsers
- [ ] PWA support (optional)

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Performance | Page load < 2s on average connection |
| Uptime | 99% (acceptable for small team) |
| Security | Auth-gated team content, no public API exposure of private data |
| Scalability | Architecture supports growth without full rewrite |
| Cost | ≤ $50/month total infrastructure |
| Maintainability | Solo-maintainable codebase, well-documented |

---

## Out of Scope (V1)
- Real-time collaboration
- In-app video hosting (embed only)
- AI features (V3)
- Native mobile apps
- Payment / monetization
- Advanced analytics
