import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Mail, 
  Sparkles, 
  Upload, 
  Send, 
  Users, 
  Check, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  History,
  FileSpreadsheet,
  Copy,
  UserCheck,
  ShieldCheck,
  Zap,
  BellRing
} from 'lucide-react';
import { Cohort, ClassSession, Student, EmailCampaign } from '../../types';
import { api } from '../../services/api';
import { firebaseStorage } from '../../services/firebase';

interface EmailAutomationHubProps {
  cohorts: Cohort[];
  selectedCohortId: string;
  classes: ClassSession[];
  students: Student[];
  campaigns: EmailCampaign[];
  initialClassTitle?: string;
  initialClassCode?: string;
  initialTemplateType?: 'announcement' | 'reminder';
  currentUser?: { email: string; name: string; photoURL?: string } | null;
  onRefresh: () => void;
}

export const EmailAutomationHub: React.FC<EmailAutomationHubProps> = ({
  cohorts,
  selectedCohortId,
  classes,
  students,
  campaigns,
  initialClassTitle,
  initialClassCode,
  initialTemplateType,
  currentUser,
  onRefresh,
}) => {
  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];
  const activeClass = classes.find((c) => c.isAttendanceOpen) || classes[0];

  // Sender information (dynamic from currently logged-in admin!)
  const senderEmail = currentUser?.email || 'ogungbadekehinde19@gmail.com';
  const senderName = currentUser?.name || 'Engr. Kehinde Ogungbade (Admin)';

  // Recipients list
  const [recipientSource, setRecipientSource] = useState<'roster' | 'upload'>('roster');
  const [recipients, setRecipients] = useState<Array<{ name: string; email: string; phone?: string }>>(() => {
    return students
      .filter((s) => !selectedCohortId || s.cohortId === selectedCohortId)
      .map((s) => ({ name: s.name, email: s.email, phone: s.phone }));
  });

  const [classTitle, setClassTitle] = useState(initialClassTitle || activeClass?.title || 'Tuesday Masterclass: Architecture & APIs');
  const [classCode, setClassCode] = useState(initialClassCode || activeClass?.code || 'CATALYST');

  // Template default based on type
  const isReminderDefault = initialTemplateType === 'reminder';

  const [campaignTitle, setCampaignTitle] = useState(
    isReminderDefault ? 'Upcoming Class Reminder Broadcast' : 'Class Session Announcement & Secret Code'
  );
  const [subject, setSubject] = useState(
    isReminderDefault
      ? 'Class Reminder: Upcoming {class_title} for {name} 📅'
      : 'Dream Team Project: Today\'s Secret Attendance Code for {name} 🚀'
  );
  const [templateBody, setTemplateBody] = useState(
    isReminderDefault
      ? `Hello {name},\n\nThis is a friendly reminder of our upcoming live class in {cohort}!\n\n📌 Topic: {class_title}\n⏰ Please be online 5 minutes before start time.\n🔑 You will receive the secret attendance word during class to record your attendance.\n\nLooking forward to seeing you active in class!\n\nBest regards,\n${senderName}\nDream Team Project`
      : `Hello {name},\n\nGet ready for our class session today in {cohort}!\n\n📌 Class Topic: {class_title}\n🔑 Today's Secret Attendance Word: {class_code}\n\nPlease join the live class, log in to the attendance portal with your email {email}, and input the secret code {class_code} to mark your attendance.\n\nLet's build excellence together!\n\nBest regards,\n${senderName}\nDream Team Project`
  );

  // Tabs & Preview
  const [activeTab, setActiveTab] = useState<'compose' | 'preview' | 'history'>('compose');
  const [previewRecipientIndex, setPreviewRecipientIndex] = useState(0);

  // AI Copilot Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPurpose, setAiPurpose] = useState('Class Attendance Code & Meeting Link Announcement');
  const [aiTone, setAiTone] = useState('Vibrant, inspiring, and urgent');
  const [aiCustomInstructions, setAiCustomInstructions] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Sending progress & states
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  const handleLoadFromRoster = () => {
    setRecipientSource('roster');
    setUploadedFileName(null);
    const cohortStudents = students
      .filter((s) => !selectedCohortId || s.cohortId === selectedCohortId)
      .map((s) => ({ name: s.name, email: s.email, phone: s.phone }));
    setRecipients(cohortStudents);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const mapped = rawJson.map((row) => {
          const keys = Object.keys(row);
          const nameKey = keys.find((k) => /name/i.test(k)) || keys[0];
          const emailKey = keys.find((k) => /email|mail/i.test(k)) || keys[1];
          const phoneKey = keys.find((k) => /phone|mobile|tel|contact/i.test(k));

          return {
            name: String(row[nameKey || ''] || '').trim(),
            email: String(row[emailKey || ''] || '').trim().toLowerCase(),
            phone: phoneKey ? String(row[phoneKey]).trim() : '',
          };
        }).filter((item) => item.name && item.email && item.email.includes('@'));

        if (mapped.length === 0) {
          alert('Could not find student rows with name and email.');
          return;
        }

        // Record file upload in Firebase
        await firebaseStorage.uploadRosterFileLog({
          fileName: file.name,
          fileSize: file.size,
          recordsCount: mapped.length,
          uploadedBy: senderEmail,
          students: mapped,
        });

        setRecipientSource('upload');
        setRecipients(mapped);
        setPreviewRecipientIndex(0);
      } catch (err: any) {
        alert('Error parsing uploaded file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleInsertTag = (tag: string) => {
    setTemplateBody((prev) => prev + ` ${tag} `);
  };

  // Generate with Gemini AI
  const handleGenerateAiEmail = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await api.draftAiEmail({
        purpose: aiPurpose,
        tone: aiTone,
        customInstructions: aiCustomInstructions,
        cohortName: selectedCohort?.name || 'Dream Team Project Cohort 2',
        classTitle,
        classCode,
      });

      setSubject(res.subject);
      setTemplateBody(res.body);
      setIsAiModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'AI draft generation failed');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const currentRecipient = recipients[previewRecipientIndex] || {
    name: 'Participant Name',
    email: 'participant@dreamteam.org',
    phone: '+234 800 000 0000',
  };

  const renderPersonalizedText = (text: string, customRec?: { name: string; email: string; phone?: string }) => {
    const target = customRec || currentRecipient;
    return text
      .replace(/\{name\}/gi, target.name)
      .replace(/\{email\}/gi, target.email)
      .replace(/\{phone\}/gi, target.phone || 'N/A')
      .replace(/\{cohort\}/gi, selectedCohort?.name || 'Dream Team Project')
      .replace(/\{class_title\}/gi, classTitle)
      .replace(/\{class_code\}/gi, classCode);
  };

  const handleCopyRendered = () => {
    const text = `Subject: ${renderPersonalizedText(subject)}\n\n${renderPersonalizedText(templateBody)}`;
    navigator.clipboard.writeText(text);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  // Dispatch broadcast
  const handleSendBroadcast = async () => {
    if (recipients.length === 0) {
      alert('Please upload or select recipients.');
      return;
    }

    if (!confirm(`Personalize and dispatch emails from "${senderEmail}" to all ${recipients.length} members? Each recipient will have their name and email personalized.`)) {
      return;
    }

    setIsSending(true);
    setSendSuccessMessage(null);

    try {
      const res = await api.sendEmailBroadcast({
        title: campaignTitle,
        subject,
        templateBody,
        targetCohortId: selectedCohortId,
        recipients,
        classTitle,
        classCode,
      });

      setSendSuccessMessage(
        `✓ ${res.message} Dispatched from sender: ${senderEmail}`
      );
      onRefresh();
      setTimeout(() => {
        setActiveTab('history');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch broadcast');
    } finally {
      setIsSending(false);
    }
  };

  // Test email to admin
  const handleSendTestToAdmin = async () => {
    setIsSending(true);
    try {
      await api.sendEmailBroadcast({
        title: `[TEST] ${campaignTitle}`,
        subject: `[TEST PREVIEW] ${subject}`,
        templateBody,
        targetCohortId: selectedCohortId,
        recipients: [{ name: senderName, email: senderEmail, phone: '+234 800 000 0000' }],
        classTitle,
        classCode,
      });

      setSendSuccessMessage(`✓ Test email personalized and sent to admin: ${senderEmail}!`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Test send failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Automated Mail Engine</span>
              </span>

              {/* Dynamic Sender Pill */}
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sender: <strong>{senderEmail}</strong></span>
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <span>Personalized Email Broadcast &amp; Class Reminder Hub</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Type <code className="text-indigo-600 font-mono bg-indigo-50 px-1 py-0.5 rounded font-bold">&#123;name&#125;</code> and the student&apos;s name will be automatically substituted and dispatched from your admin email.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendTestToAdmin}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Test to Me</span>
            </button>

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Draft with Gemini AI</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'compose' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Compose &amp; Choose Recipients</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Personalized Preview ({recipients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Sent Campaign Logs ({campaigns.length})</span>
          </button>
        </div>
      </div>

      {sendSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{sendSuccessMessage}</span>
        </div>
      )}

      {/* TAB 1: COMPOSE */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-100 space-y-4">
              
              {/* Sender Details Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">Dispatching As Admin:</span>
                  <span className="font-bold text-slate-900">{senderName}</span>
                  <span className="text-indigo-600 font-mono font-semibold">&lt;{senderEmail}&gt;</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Live Sender Auth
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Line (Supports &#123;name&#125;) *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Dream Team Class Reminder for {name} 🚀"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Dynamic Tag Pills */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider block mb-2">
                  Click to Insert Dynamic Placeholder Tags into Body:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { tag: '{name}', desc: 'Student Name' },
                    { tag: '{email}', desc: 'Email' },
                    { tag: '{phone}', desc: 'Phone' },
                    { tag: '{cohort}', desc: 'Cohort' },
                    { tag: '{class_title}', desc: 'Class Topic' },
                    { tag: '{class_code}', desc: 'Secret Code' },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => handleInsertTag(item.tag)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-800 text-xs font-mono font-black transition-all cursor-pointer shadow-2xs hover:scale-105"
                    >
                      <span>{item.tag}</span>
                      <span className="text-[10px] font-sans opacity-70">({item.desc})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Title & Code context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Value for &#123;class_title&#125;
                  </label>
                  <input
                    type="text"
                    value={classTitle}
                    onChange={(e) => setClassTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Value for &#123;class_code&#125; (Secret Word)
                  </label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    className="w-full bg-white border-2 border-indigo-300 rounded-xl px-3 py-2 text-xs font-mono font-black text-indigo-700 uppercase"
                  />
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Message Body *
                </label>
                <textarea
                  rows={9}
                  required
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Individual Emails</span>
                  </button>

                  <button
                    type="button"
                    disabled={recipients.length === 0}
                    onClick={() => {
                      if (recipients.length === 0) return;
                      const bccList = recipients.map(r => r.email).join(',');
                      const sampleRecipient = recipients[0] || { name: 'Member', email: '' };
                      const renderedSub = encodeURIComponent(renderPersonalizedText(subject, sampleRecipient));
                      const renderedTxt = encodeURIComponent(renderPersonalizedText(templateBody, sampleRecipient));
                      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${bccList}&su=${renderedSub}&body=${renderedTxt}`;
                      window.open(gmailUrl, '_blank');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                    title="Open in Gmail with all recipients in BCC"
                  >
                    <Mail className="w-4 h-4 text-rose-600" />
                    <span>Open in Gmail (BCC)</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isSending || recipients.length === 0}
                  onClick={handleSendBroadcast}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching from {senderEmail}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send to All {recipients.length} Members</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Right Column: Upload File / Roster */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-md shadow-slate-100 space-y-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Audience &amp; Upload</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={handleLoadFromRoster}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    recipientSource === 'roster' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cohort ({students.filter((s) => s.cohortId === selectedCohortId).length})
                </button>
                <label
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center cursor-pointer transition-all ${
                    recipientSource === 'upload' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload File
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center bg-slate-50">
                <Upload className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-900">
                  {uploadedFileName || 'Upload Excel (.xlsx) or CSV file'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Columns: Name, Email, Phone
                </p>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="mt-2 text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-indigo-600 file:text-white cursor-pointer"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-700">Loaded Recipients:</span>
                  <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {recipients.length} Members
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs pr-1">
                  {recipients.slice(0, 10).map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="truncate mr-2">
                        <p className="font-bold text-slate-900 truncate">{r.name}</p>
                        <p className="text-[10px] text-indigo-600 truncate font-medium">{r.email}</p>
                      </div>
                    </div>
                  ))}
                  {recipients.length > 10 && (
                    <p className="text-center text-[10px] text-slate-400 pt-1">
                      + {recipients.length - 10} more members
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 2: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-md shadow-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <span>Personalized Email Rendering Inspector</span>
              </h4>
              <p className="text-xs text-slate-500">
                Notice how &#123;name&#125; is replaced with the recipient&apos;s real name and sender is set to <strong className="text-slate-800">{senderEmail}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Switch Recipient:</span>
              <select
                value={previewRecipientIndex}
                onChange={(e) => setPreviewRecipientIndex(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                {recipients.map((r, idx) => (
                  <option key={idx} value={idx}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email Preview Card */}
          <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-lg">
            <div className="bg-white px-5 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">From:</span>
                <span className="font-black text-slate-900">{senderName} &lt;{senderEmail}&gt;</span>
              </div>
              <button
                onClick={handleCopyRendered}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedPreview ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-6 border-b border-slate-200 space-y-2 text-xs">
              <p><strong className="text-slate-500">To:</strong> <span className="font-bold text-slate-900">{currentRecipient.name} &lt;{currentRecipient.email}&gt;</span></p>
              <p><strong className="text-slate-500">Subject:</strong> <span className="font-black text-indigo-700 text-sm">{renderPersonalizedText(subject)}</span></p>
            </div>

            <div className="p-6 text-slate-800 text-sm whitespace-pre-wrap font-medium leading-relaxed bg-white">
              {renderPersonalizedText(templateBody)}
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleSendBroadcast}
              disabled={isSending || recipients.length === 0}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white font-black text-sm shadow-xl shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Confirm &amp; Send Broadcast to All {recipients.length} Members</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-100 space-y-4">
          <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Dispatched Campaign History &amp; Delivery Status</span>
          </h4>

          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Mail className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              No campaigns dispatched yet.
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div key={camp.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-sm font-black text-slate-900">{camp.title}</h5>
                      <p className="text-xs text-indigo-600 font-semibold">{camp.subject}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Sender: <strong>{senderEmail}</strong></p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {camp.recipientCount} Dispatched
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(camp.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>Draft Email with Gemini AI</span>
              </h3>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-900">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Purpose / Goal</label>
                <select
                  value={aiPurpose}
                  onChange={(e) => setAiPurpose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                >
                  <option value="Upcoming Class Reminder & Preparation Alert">
                    Upcoming Class Reminder &amp; Preparation Alert
                  </option>
                  <option value="Class Attendance Code & Meeting Link Announcement">
                    Class Attendance Code &amp; Meeting Announcement
                  </option>
                  <option value="Urgent Attendance Warning for Absent Members">
                    Urgent Attendance Warning for Absent Members
                  </option>
                  <option value="Weekly Cohort Progress & Motivation Newsletter">
                    Weekly Cohort Progress &amp; Motivation
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tone</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                >
                  <option value="Vibrant, inspiring, and urgent">Vibrant &amp; Urgent</option>
                  <option value="Warm, encouraging, and welcoming">Warm &amp; Encouraging</option>
                  <option value="Direct, professional, and accountability-driven">Professional &amp; Strict</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Custom Instructions (Optional)</label>
                <textarea
                  rows={2}
                  value={aiCustomInstructions}
                  onChange={(e) => setAiCustomInstructions(e.target.value)}
                  placeholder="e.g. Include note that meeting link is in calendar and attendance code is shared during class."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAiEmail}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20"
                >
                  {isGeneratingAi ? 'Generating...' : 'Generate Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
