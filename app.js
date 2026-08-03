(() => {
  'use strict';

  const STORAGE_KEY = 'invitation-letter-studio-v3';
  const templates = {
    worship: {
      icon: '♪', title: 'Fall Worship Concert', description: 'Invite a church congregation to a September worship and music event.', audience: 'Churches and ministries',
      recipientLabel: 'Church name', recipientTitleLabel: 'Pastor or ministry contact', participantsLabel: 'Featured artists or performers',
      subject: d => `Invitation to an Evening of Worship and Music – ${v(d.eventName, '[Concert Name]')}`,
      salutation: d => `Dear Pastor and Church Family at ${v(d.recipient, '[Target Church Name]')},`,
      paragraphs: d => [
        'Greetings in the name of our Lord and Savior, Jesus Christ!',
        `We are thrilled to invite your congregation to join us for ${v(d.eventName, '[Concert Name]')}, a special evening of musical worship, fellowship, and praise.`,
        'As we enter a new season this fall, our desire is to bring together local churches to unite in worship, encourage one another, and celebrate God’s goodness through music.'
      ],
      afterDetails: d => [
        'We would be honored if you could share this invitation with your congregation through your church bulletins or announcements. Groups and families of all ages are welcome!',
        contactSentence(d),
        'Thank you for your partnership in the Gospel, and we look forward to worshiping alongside you!'
      ], closing: 'In His Service,'
    },
    christmas: {
      icon: '✦', title: 'Christmas Concert', description: 'A warm seasonal invitation for a church family and Christmas music celebration.', audience: 'Churches and ministries',
      recipientLabel: 'Church name', recipientTitleLabel: 'Pastor or ministry contact', participantsLabel: 'Featured performers',
      subject: d => `Christmas Concert Invitation: ${v(d.eventName, '[Concert Name]')}`,
      salutation: d => `Dear ${v(d.recipient, '[Target Church Name]')} Family,`,
      paragraphs: d => [
        'Grace and peace to you in this joyous season!',
        `As we prepare to celebrate the birth of our Savior, ${v(d.hostOrganization, '[Host Church/Ministry Name]')} warmly invites your congregation to join us for our Christmas concert, ${v(d.eventName, '[Concert Name]')}.`,
        'This special evening will feature seasonal classics, inspirational praise, and joyful musical performances centered on the hope and light that Jesus brings into the world.'
      ],
      afterDetails: d => [
        d.includeRefreshments ? `Light refreshments and fellowship will follow the performance in the ${v(d.fellowshipLocation, '[Fellowship Hall/Foyer]')}.` : '',
        'Please feel free to share this invitation with your members. We hope to see many of your congregation there as we celebrate the reason for the season together.',
        'May God bless your ministry during this holy season.'
      ].filter(Boolean), closing: 'Warmly in Christ,'
    },
    school: {
      icon: '🎓', title: 'Senior High School', description: 'Invite Grade 11 and Grade 12 students through their principal or school head.', audience: 'Schools and senior high students',
      recipientLabel: 'School name', recipientTitleLabel: 'Principal, school head, or coordinator', participantsLabel: 'Featured performers or program guests',
      subject: d => `Invitation for Grade 11 and Grade 12 Students – ${v(d.eventName, '[Event Name]')}`,
      salutation: d => `Dear ${v(d.recipientTitle, 'School Principal')} of ${v(d.recipient, '[School Name]')},`,
      paragraphs: d => [
        'Warm greetings!',
        `${v(d.hostOrganization, '[Host Organization]')} respectfully invites the ${v(d.studentGroup, 'Grade 11 and Grade 12 students')} of ${v(d.recipient, '[School Name]')} to attend ${v(d.eventName, '[Event Name]')}.`,
        'The program is designed to give senior high school students an enjoyable and meaningful cultural experience through live music, community participation, and positive engagement.'
      ],
      afterDetails: d => [
        d.schoolNote || 'Teachers, advisers, and authorized school personnel are welcome to accompany and supervise participating students.',
        d.confirmationDeadline ? `To assist with seating and coordination, please confirm your school’s participation on or before ${formatDate(d.confirmationDeadline)}.` : 'Please contact us so we can assist with attendance confirmation, seating, and school coordination.',
        contactSentence(d),
        'We would be honored to welcome your students and school representatives to this special event.'
      ], closing: 'Respectfully yours,'
    },
    band: {
      icon: '♬', title: 'Institutional Band', description: 'Request a performance from a government, police, military, or agency band.', audience: 'Government and institutional bands',
      recipientLabel: 'Band or institution name', recipientTitleLabel: 'Band director, commanding officer, or officer-in-charge', participantsLabel: 'Other featured performers',
      subject: d => `Invitation to Perform at ${v(d.eventName, '[Event Name]')}`,
      salutation: d => `Dear ${v(d.recipientTitle, 'Band Director / Officer-in-Charge')},`,
      paragraphs: d => [
        'Warm greetings!',
        `On behalf of ${v(d.hostOrganization, '[Host Organization]')}, we respectfully invite the ${v(d.recipient, '[Institutional Band Name]')} to perform at ${v(d.eventName, '[Event Name]')}.`,
        'Your participation would add distinction, energy, and meaningful public service to the occasion, while giving our audience the opportunity to appreciate the excellence and discipline represented by your ensemble.'
      ],
      afterDetails: d => [
        `We respectfully request a performance of approximately ${v(d.performanceLength, '[Performance Length]')}. Suggested selections may include ${v(d.repertoire, '[Preferred Repertoire]')}.`,
        d.logistics || 'Please advise us of your staging, sound, transport access, security, and other logistical requirements so we can coordinate properly.',
        contactSentence(d),
        'We sincerely hope your distinguished band can join us, and we look forward to the possibility of working with your office.'
      ], closing: 'Respectfully yours,'
    }
  };

  const ids = ['recipient','recipientTitle','eventName','eventDate','eventTime','doorsOpen','admission','venue','address','participants','studentGroup','confirmationDeadline','schoolNote','performanceLength','repertoire','logistics','includeRefreshments','fellowshipLocation','senderName','senderTitle','hostOrganization','email','phone','website'];
  const $ = id => document.getElementById(id);
  const fields = Object.fromEntries(ids.map(id => [id, $(id)]));
  const required = ['recipient','eventName','eventDate','eventTime','admission','venue','address','participants','senderName','hostOrganization','email','phone'];
  let state = { template:'worship' };
  let saveTimer;

  function v(value, fallback) { return value && String(value).trim() ? escapeHtml(String(value).trim()) : `<span class="placeholder">${escapeHtml(fallback)}</span>`; }
  function escapeHtml(value) { return value.replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
  function textValue(value, fallback) { return value && String(value).trim() ? String(value).trim() : fallback; }
  function formatDate(value) { if (!value) return ''; const date = new Date(`${value}T00:00:00`); return new Intl.DateTimeFormat('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(date); }
  function formatTime(value) { if (!value) return ''; const [h,m] = value.split(':').map(Number); return new Intl.DateTimeFormat('en-PH',{hour:'numeric',minute:'2-digit'}).format(new Date(2000,0,1,h,m)); }
  function contactSentence(d) {
    const contact = [d.email, d.phone].filter(Boolean).join(' or ');
    const website = d.website ? ` or visit ${d.website}` : '';
    return contact ? `For questions or further information, please contact us at ${contact}${website}.` : 'For questions or further information, please contact us using the details below.';
  }

  function collectData() {
    const data = { template:state.template };
    ids.forEach(id => { data[id] = fields[id].type === 'checkbox' ? fields[id].checked : fields[id].value; });
    return data;
  }

  function renderTemplateCards() {
    $('templateGrid').innerHTML = Object.entries(templates).map(([key,t]) => `
      <button class="template-card${state.template===key?' active':''}" type="button" data-template="${key}" role="listitem" aria-pressed="${state.template===key}">
        <span class="template-icon" aria-hidden="true">${t.icon}</span>
        <h3>${t.title}</h3><p>${t.description}</p><span class="template-audience">${t.audience}</span>
      </button>`).join('');
    document.querySelectorAll('.template-card').forEach(btn => btn.addEventListener('click', () => setTemplate(btn.dataset.template)));
  }

  function setTemplate(key) {
    state.template = key;
    renderTemplateCards();
    $('recipientLabel').textContent = templates[key].recipientLabel;
    $('recipientTitleLabel').innerHTML = `${templates[key].recipientTitleLabel} <em>optional</em>`;
    $('participantsLabel').textContent = templates[key].participantsLabel;
    $('schoolFields').hidden = key !== 'school';
    $('bandFields').hidden = key !== 'band';
    $('christmasFields').hidden = key !== 'christmas';
    renderLetter();
    queueSave();
  }

  function detailRows(d) {
    const rows = [
      ['Date', d.eventDate ? formatDate(d.eventDate) : '[Event Date]'],
      ['Time', d.eventTime ? `${formatTime(d.eventTime)}${d.doorsOpen ? ` (Doors open at ${formatTime(d.doorsOpen)})` : ''}` : '[Event Time]'],
      ['Location', `${textValue(d.venue,'[Venue Name]')} – ${textValue(d.address,'[Address]')}`],
      ['Featured', textValue(d.participants,'[Featured Performers]')],
      ['Admission', textValue(d.admission,'[Admission Details]')]
    ];
    return rows.map(([label,value]) => `<div class="detail-row"><strong>${escapeHtml(label)}:</strong><span>${value.startsWith('[')?`<span class="placeholder">${escapeHtml(value)}</span>`:escapeHtml(value)}</span></div>`).join('');
  }

  function renderLetter() {
    const d = collectData();
    const t = templates[state.template];
    const body = t.paragraphs(d).map(p => `<p>${p}</p>`).join('');
    const after = t.afterDetails(d).map(p => `<p>${escapeHtml(p)}</p>`).join('');
    const senderName = v(d.senderName,'[Your Name/Organization]');
    const senderTitle = d.senderTitle ? `<p>${escapeHtml(d.senderTitle)}</p>` : '';
    const host = v(d.hostOrganization,'[Host Organization]');
    const contacts = [d.email,d.phone,d.website].filter(Boolean).map(escapeHtml).join(' · ') || '<span class="placeholder">[Contact Information]</span>';

    $('letterPaper').innerHTML = `
      <div class="letterhead"><span class="letterhead-mark" aria-hidden="true">${t.icon}</span><div><strong>${escapeHtml(d.hostOrganization || 'Your Organization')}</strong><small>Official invitation</small></div></div>
      <div class="letter-rule"></div>
      <p class="letter-subject"><strong>Subject:</strong> ${t.subject(d)}</p>
      <p>${t.salutation(d)}</p>
      ${body}
      <div class="detail-box"><h3>Event details</h3><div class="detail-list">${detailRows(d)}</div></div>
      ${after}
      <div class="signature-block"><p>${t.closing}</p><p class="signature-name">${senderName}</p>${senderTitle}<p>${host}</p><p>${contacts}</p></div>
      <div class="letter-footer">Invitation Letter Studio · Prepared for ${escapeHtml(d.recipient || 'your recipient')}</div>`;
    updateProgress(d);
  }

  function updateProgress(d) {
    let relevant = [...required];
    if (state.template === 'school') relevant.push('studentGroup');
    if (state.template === 'band') relevant.push('performanceLength','repertoire');
    const done = relevant.filter(key => String(d[key] || '').trim()).length;
    const percent = Math.round(done / relevant.length * 100);
    $('progressText').textContent = `${percent}% complete`;
    $('progressBar').style.width = `${percent}%`;
  }

  function getPlainText() {
    const d = collectData();
    const t = templates[state.template];
    const details = [
      `Date: ${d.eventDate ? formatDate(d.eventDate) : '[Event Date]'}`,
      `Time: ${d.eventTime ? formatTime(d.eventTime) : '[Event Time]'}${d.doorsOpen ? ` (Doors open at ${formatTime(d.doorsOpen)})` : ''}`,
      `Location: ${textValue(d.venue,'[Venue Name]')} – ${textValue(d.address,'[Address]')}`,
      `Featured: ${textValue(d.participants,'[Featured Performers]')}`,
      `Admission: ${textValue(d.admission,'[Admission Details]')}`
    ].join('\n');
    return [
      `Subject: ${stripHtml(t.subject(d))}`, '', stripHtml(t.salutation(d)), '',
      ...t.paragraphs(d).map(stripHtml), '', 'EVENT DETAILS', details, '',
      ...t.afterDetails(d), '', t.closing, '',
      textValue(d.senderName,'[Your Name/Organization]'), d.senderTitle, textValue(d.hostOrganization,'[Host Organization]'),
      [d.email,d.phone,d.website].filter(Boolean).join(' | ') || '[Contact Information]'
    ].filter((line,index,arr) => line !== '' || arr[index-1] !== '').join('\n');
  }
  function stripHtml(html) { const div = document.createElement('div'); div.innerHTML = html; return div.textContent || ''; }

  async function copyLetter() {
    try { await navigator.clipboard.writeText(getPlainText()); toast('Letter copied'); }
    catch { const ta=document.createElement('textarea');ta.value=getPlainText();document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Letter copied'); }
  }
  function toast(message) { const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(el._timer); el._timer=setTimeout(()=>el.classList.remove('show'),2200); }

  function queueSave() {
    $('saveStatus').textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectData()));
      $('saveStatus').textContent = 'Saved locally';
    }, 250);
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.template && templates[saved.template]) state.template = saved.template;
      ids.forEach(id => {
        if (saved[id] === undefined) return;
        if (fields[id].type === 'checkbox') fields[id].checked = Boolean(saved[id]); else fields[id].value = saved[id];
      });
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }

  function resetDraft() {
    if (!confirm('Clear every field and start a new draft?')) return;
    $('letterForm').reset();
    fields.includeRefreshments.checked = true;
    fields.studentGroup.value = 'Grade 11 and Grade 12 students';
    localStorage.removeItem(STORAGE_KEY);
    state.template = 'worship';
    setTemplate('worship');
    renderLetter();
    toast('New draft ready');
  }

  ids.forEach(id => fields[id].addEventListener(fields[id].type === 'checkbox' ? 'change' : 'input', () => { renderLetter(); queueSave(); }));
  $('copyButton').addEventListener('click', copyLetter);
  $('mobileCopyButton').addEventListener('click', copyLetter);
  $('printButton').addEventListener('click', () => window.print());
  $('mobilePrintButton').addEventListener('click', () => window.print());
  $('newDraftButton').addEventListener('click', resetDraft);

  restore();
  setTemplate(state.template);
})();
