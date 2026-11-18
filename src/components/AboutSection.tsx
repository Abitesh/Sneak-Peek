import React from 'react';
import { useT } from '../i18n';
import { Shield, Cpu, Database, MicOff, Star, Bug, Globe, Zap, ListTodo } from 'lucide-react';
import { getModifierSymbol } from '../utils/platformUtils';

const repositoryUrl = 'https://github.com/Abitesh/Sneak-Peek';

interface AboutSectionProps { }

export const AboutSection: React.FC<AboutSectionProps> = () => {
    const t = useT();
    const handleOpenLink = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
        e.preventDefault();
        if (window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(url);
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="space-y-6 animated fadeIn pb-10" data-settings-stagger>
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">{t('About Sneak-Peek')}</h3>
                <p className="text-sm text-text-secondary">{t('Designed to be invisible, intelligent, and trusted.')}</p>
            </div>

            {/* What's New Section */}
            <div>
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">{t("What's New in v2.8.7")}</h4>
                <div className="bg-bg-item-surface rounded-xl border border-border-subtle overflow-hidden">
                    {/* 1. Auto Answer */}
                    <div className="p-3 border-b border-border-subtle bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">Auto Answer (Beta)</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Answers appear on their own the moment the other person finishes a question. Sneak-Peek judges whether an answer is actually wanted and stays silent when it isn't. Off by default — turn it on in General.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. A New Answer Engine */}
                    <div className="p-3 border-b border-border-subtle bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                <Cpu size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">A New Answer Engine</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Answers now pick their source properly — your résumé, an uploaded document, the live conversation, or general knowledge — instead of blending them. Follow-ups keep the thread even after the topic changes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Meeting Notes, Rebuilt */}
                    <div className="p-3 border-b border-border-subtle bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <ListTodo size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">Meeting Notes, Rebuilt</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Summaries adapt to the kind of meeting you're in, get a real title instead of the first line of the transcript, and scale with meeting length. Plus editable speaker labels and a ready-to-send follow-up email draft.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Browser Companion */}
                    <div className="p-3 border-b border-border-subtle bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">Browser Companion for Chrome</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Press {getModifierSymbol('commandorcontrol')}+Y to pull the page you're looking at into your next answer — a job description, a coding problem, documentation. One click enables it everywhere.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 5. Hindsight Long-Term Memory */}
                    <div className="p-3 bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                <Database size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">Hindsight Long-Term Memory</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    A local vector database that indexes your past meetings, profiles and documents, so Sneak-Peek can recall what was said weeks ago — not just in this session. Pro, and opt-in from Settings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Architecture Section */}
            <div>
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">{t('How Sneak-Peek Works')}</h4>
                <div className="bg-bg-item-surface rounded-xl border border-border-subtle overflow-hidden">
                    <div className="p-3 border-b border-border-subtle bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <Cpu size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">Stateful Intelligence OS</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Acts as a persistent control plane using mode-aware priors (Sales, Technical, Lecture) to dynamically filter context and direct queries to the optimal reasoning engine.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                <Database size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">Hindsight LTM & Session Memory</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Combines a secure local sidecar vector database for document indexing with a time-decayed sliding transcript memory to retrieve relevant semantic context on-demand.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Privacy Section */}
            <div>
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">{t('Privacy & Data')}</h4>
                <div className="bg-bg-item-surface rounded-xl border border-border-subtle p-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <Shield size={16} className="text-green-400 mt-0.5" />
                        <div>
                            <h5 className="text-sm font-medium text-text-primary">{t('Stealth & Control')}</h5>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                Features "Undetectable Mode" to hide from the dock and "Masquerading" to disguise as system apps. You control exactly what data leaves your device.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MicOff size={16} className="text-red-500 mt-0.5" />
                        <div>
                            <h5 className="text-sm font-medium text-text-primary">{t('No Recording')}</h5>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                Sneak-Peek listens only when active. It does not record video, take arbitrary screenshots without command, or perform background surveillance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Community Section */}
            <div>
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">{t('Community')}</h4>
                <div className="space-y-4">
                    {/* 2. Star & Report */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a
                            href={repositoryUrl}
                            onClick={(e) => handleOpenLink(e, repositoryUrl)}
                            className="bg-bg-item-surface border border-border-subtle rounded-xl p-5 transition-all group flex items-center gap-4 h-full hover:bg-white/10"
                        >
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 group-hover:scale-110 transition-transform">
                                <Star size={20} className="transition-all group-hover:fill-current" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary">{t('Star on GitHub')}</h5>
                                <p className="text-xs text-text-secondary mt-0.5">{t('Love Sneak-Peek? Support us by starring the repo.')}</p>
                            </div>
                        </a>

                        <a
                            href={`${repositoryUrl}/issues`}
                            onClick={(e) => handleOpenLink(e, `${repositoryUrl}/issues`)}
                            className="bg-bg-item-surface border border-border-subtle rounded-xl p-5 transition-all group flex items-center gap-4 h-full hover:bg-white/10"
                        >
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform">
                                <Bug size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary">{t('Report an Issue')}</h5>
                                <p className="text-xs text-text-secondary mt-0.5">{t('Found a bug? Let us know so we can fix it.')}</p>
                            </div>
                        </a>
                    </div>

                </div>
            </div>

            {/* Credits */}
            <div className="pt-4 border-t border-border-subtle">
                <div>
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">{t('Core Technology')}</h4>
                    <div className="flex flex-wrap gap-2">
                        {['Groq', 'Gemini', 'OpenAI', 'Deepgram', 'ElevenLabs', 'Electron', 'React', 'Rust', 'Sharp', 'TypeScript', 'Tailwind CSS', 'Vite', 'Google Cloud', 'SQLite'].map(tech => (
                            <span key={tech} className="px-2.5 py-1 rounded-md bg-bg-input border border-border-subtle text-[11px] font-medium text-text-secondary">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="pt-4 border-t border-border-subtle">
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Legal notice</h4>
                <p className="text-xs text-text-secondary">
                    This project is based on Natively, originally developed by Natively AI Private Limited.
                </p>
            </div>
        </div >
    );
};
