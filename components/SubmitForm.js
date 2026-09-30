// The public form shown at /submit/<site-id>. Edit the wording here,
// for example to translate it for your visitors.

const ERRORS = {
  email: 'Enter a valid email address so we can reply to you.',
  message: 'Write a message before sending.',
  server: 'Your message could not be sent. Try again in a minute.',
};

export default function SubmitForm({ site, sent, ticketRef, error, accent }) {
  const style = accent ? { '--accent': accent, '--accent-hover': accent } : undefined;

  if (sent) {
    return (
      <div className="submit" style={style}>
        <div className="submit-done" role="status">
          <h1>Message sent</h1>
          <p>
            {ticketRef ? (
              <>
                Your ticket number is <strong>#{ticketRef}</strong>.{' '}
              </>
            ) : null}
            We&rsquo;ll reply to you by email.
          </p>
          <a href={`/submit/${site.id}${accent ? `?accent=${accent.slice(1)}` : ''}`}>
            Send another message
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="submit" style={style}>
      <form className="submit-form" method="post" action="/api/tickets">
        <input type="hidden" name="site" value={site.id} />
        {error ? (
          <p className="form-error" role="alert">
            {ERRORS[error] ?? ERRORS.server}
          </p>
        ) : null}
        <div className="field-row">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" autoComplete="name" maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={200}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input id="subject" name="subject" type="text" maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" rows={6} required maxLength={10000} />
        </div>
        <div className="hp" aria-hidden="true">
          <label htmlFor="website">Leave this field empty</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <button type="submit" className="btn btn-primary">
          Send message
        </button>
      </form>
    </div>
  );
}
