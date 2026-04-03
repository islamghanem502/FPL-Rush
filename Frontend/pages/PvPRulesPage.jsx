import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const PvPRulesPage = () => {
    return (
        <Layout>
            <div className="w-full px-4 py-8 sm:py-12 min-h-screen" dir="rtl">
                <div className="max-w-3xl mx-auto text-white">
                    {/* Header */}
                    <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-indigo-500/30 shadow-lg p-6 sm:p-8 mb-8 text-center relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 mb-2" />
                         <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 border-2 border-indigo-400 rounded-full flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-4 shadow-md">
                             📖
                         </div>
                         <h1 className="text-2xl sm:text-3xl font-black mb-2 text-white tracking-tight">
                             دليل تحدي المعارك (PvP)
                         </h1>
                         <p className="text-sm text-gray-400 font-bold">
                             تعرف على قواعد التحدي وكيفية كسب النقاط!
                         </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {/* Section 1 */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm">
                            <h2 className="text-lg sm:text-xl font-black text-indigo-400 mb-3 flex items-center gap-2">
                                ⚔️ ما هو تحدي PvP؟
                            </h2>
                            <p className="text-[11px] sm:text-sm text-gray-300 leading-relaxed font-medium">
                                هو تحدي مبني على التوقعات، حيث نعرض لك مواجهات (وجهاً لوجه) بين لاعبين من الدوري الإنجليزي. 
                                هدفك هو توقع اللاعب الذي سيحقق <strong>مجموع نقاط أكثر</strong> في الجولة (GW) القادمة.
                                يمكنك أيضاً توقع <strong>التعادل</strong> إذا كنت تعتقد أن اللاعبين سيحصدان نفس عدد النقاط بالضبط.
                            </p>
                        </div>

                        {/* Section 2 */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm">
                            <h2 className="text-lg sm:text-xl font-black text-[#22c55e] mb-3 flex items-center gap-2">
                                🎯 كيفية احتساب النقاط؟
                            </h2>
                            <ul className="space-y-3 text-[11px] sm:text-sm text-gray-300 font-medium list-disc list-inside">
                                <li>
                                    <strong>التوقع الصحيح للفائز:</strong> تحصل على <span className="text-white font-black px-2 py-0.5 bg-[#22c55e]/20 rounded-md">3 نقاط</span> في جدول الترتيب.
                                </li>
                                <li>
                                    <strong>التوقع الصحيح للتعادل:</strong> تحصل على <span className="text-white font-black px-2 py-0.5 bg-[#22c55e]/20 rounded-md">3 نقاط</span>.
                                </li>
                                <li>
                                    <strong>التوقع الخاطئ:</strong> يتم خصم <span className="text-white font-black px-2 py-0.5 bg-red-500/20 rounded-md text-red-400 border border-red-500/30">1 نقطة (-1)</span> من رصيدك.
                                </li>
                            </ul>
                        </div>

                        {/* Section 3 */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm border-l-4 border-l-orange-500">
                            <h2 className="text-lg sm:text-xl font-black text-orange-400 mb-3 flex items-center gap-2">
                                🔥 المواجهة المزدوجة (Double Points)
                            </h2>
                            <p className="text-[11px] sm:text-sm text-gray-300 leading-relaxed font-medium mb-3">
                                بعض المواجهات في التحدي يتم تمييزها بشارة <strong>🔥 Double (6 نقاط)</strong>. هذه المواجهات تعتبر استثنائية أو صعبة التوقع، وتمنحك ضعف النقاط!
                            </p>
                            <ul className="space-y-3 text-[11px] sm:text-sm text-gray-300 font-medium list-disc list-inside">
                                <li>
                                    <strong>التوقع الصحيح (فوز أو تعادل):</strong> تحصل على <span className="text-white font-black px-2 py-0.5 bg-orange-500/20 rounded-md text-orange-400 border border-orange-500/30">6 نقاط</span>.
                                </li>
                                <li>
                                    <strong>التوقع الخاطئ:</strong> يتم خصم <span className="text-white font-black px-2 py-0.5 bg-red-500/20 rounded-md text-red-400 border border-red-500/30">نقطتين (-2)</span> من رصيدك.
                                </li>
                            </ul>
                        </div>

                        {/* Section 4 */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm">
                            <h2 className="text-lg sm:text-xl font-black text-fuchsia-400 mb-3 flex items-center gap-2">
                                🏆 حسم التعادل في الترتيب (Tie-breaker)
                            </h2>
                            <p className="text-[11px] sm:text-sm text-gray-300 leading-relaxed font-medium">
                                في حال تعادل أكثر من مشارك في نفس عدد نقاط التحدي، يتم ترتيبهم بناءً على أدائهم في تشكيلة الفانتاسي الأصلية الخاصة بهم بالترتيب التالي:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 mt-3 text-[11px] sm:text-sm text-gray-400 font-medium">
                                <li>مجموع النقاط المحصلة في نفس الجولة (GW Points).</li>
                                <li>النقاط الكلية للفريق في الفانتاسي (Total Points).</li>
                            </ol>
                        </div>
                    </div>

                    <div className="mt-8 text-center flex items-center justify-center">
                        <button onClick={() => window.history.back()} className="px-8 py-3 bg-slate-700 text-white font-black rounded-xl hover:bg-slate-600 transition-all border border-slate-600 shadow-lg active:scale-95">
                            ⬅️ العودة
                        </button>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default PvPRulesPage;
