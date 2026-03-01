const fs = require('fs');
const file = './src/components/board/TicketModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Header Background and Overlay
content = content.replace(
    /<div className="fixed inset-0 z-50 flex items-center justify-center bg-black\/50 p-4">/g,
    '<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">'
);
content = content.replace(
    /<div className="bg-white shadow-2xl w-full max-w-2xl max-h-\[90vh\] overflow-hidden flex flex-col">/g,
    '<div className="bg-white shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-none">'
);

// Header elements
content = content.replace(
    /<div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">/g,
    '<div className="px-6 py-5 border-b border-black flex justify-between items-center bg-white">'
);
content = content.replace(
    /<h3 className="text-2xl font-bold text-gray-900 tracking-tight">/g,
    '<h3 className="text-3xl font-bold text-black font-[family-name:--font-for-five] tracking-tight uppercase">'
);
content = content.replace(
    /<p className="text-xs font-medium text-gray-500 mt-1">/g,
    '<p className="text-xs font-bold text-gray-500 mt-1.5 uppercase tracking-wide">'
);
content = content.replace(
    /<span className="font-semibold text-gray-700">/g,
    '<span className="text-black">'
);
content = content.replace(
    /<button onClick={onClose} className="text-gray-400 hover:text-gray-600">/g,
    '<button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">'
);

// Labels
content = content.replace(
    /<label className="block text-sm font-semibold text-gray-600 mb-1\.5">/g,
    '<label className="block text-xs font-bold text-black uppercase tracking-wide mb-1.5">'
);
content = content.replace(
    /<h4 className="text-sm font-semibold text-gray-600 mb-3">/g,
    '<h4 className="text-xs font-bold text-black uppercase tracking-wide mb-3">'
);


// Inputs, selects, textareas
content = content.replace(
    /className="w-full px-3 py-2 text-base font-normal text-gray-900 placeholder:text-gray-400 border border-gray-300 focus:ring-2 focus:ring-black outline-none"/g,
    'className="w-full px-3 py-2 text-base font-medium text-black placeholder:text-gray-400 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none transition-colors"'
);
content = content.replace(
    /className="w-full px-3 py-2 text-base font-normal text-gray-900 border border-gray-300 focus:ring-2 focus:ring-black outline-none bg-white appearance-none pr-10"/g,
    'className="w-full px-3 py-2 text-base font-medium text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white appearance-none pr-10 rounded-none transition-colors"'
);
content = content.replace(
    /className="w-full px-3 py-2 text-base font-normal text-gray-900 placeholder:text-gray-400 border border-gray-300 focus:ring-2 focus:ring-black outline-none resize-none"/g,
    'className="w-full px-3 py-2 text-base font-medium text-black placeholder:text-gray-400 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none resize-none rounded-none transition-colors"'
);

// Resources
content = content.replace(
    /className="flex-1 px-3 py-2 text-base font-normal text-gray-900 placeholder:text-gray-400 border border-gray-300 focus:ring-1 focus:ring-black outline-none"/g,
    'className="flex-1 px-3 py-2 text-base font-medium text-black placeholder:text-gray-400 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none transition-colors"'
);
content = content.replace(
    /className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold tracking-wide hover:bg-gray-200 disabled:opacity-50"/g,
    'className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wide hover:bg-gray-800 disabled:opacity-50 transition-colors rounded-none"'
);
content = content.replace(
    /className={`px-3 py-1 text-sm font-medium border transition-colors \${isSelected/g,
    'className={`px-3 py-1 text-xs font-bold uppercase tracking-wide border transition-colors rounded-none ${isSelected'
);
content = content.replace(
    /<span key={resource.id} className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-sm font-medium">/g,
    '<span key={resource.id} className="px-3 py-1 bg-white text-black border border-black text-xs font-bold uppercase tracking-wide rounded-none">'
);

// Bottom buttons
content = content.replace(
    /<button\n\s*type="button"\n\s*onClick={onClose}\n\s*className="px-4 py-2 text-gray-700 text-sm font-semibold tracking-wide hover:bg-gray-100"\n\s*>/g,
    '<button\n                            type="button"\n                            onClick={onClose}\n                            className="px-4 py-2 text-gray-700 hover:text-black text-xs font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors rounded-none"\n                        >'
);
content = content.replace(
    /<button\n\s*type="submit"\n\s*form="ticket-form"\n\s*disabled={loading \|\| \(!ticket && !initialComment.trim\(\)\)}\n\s*className="px-6 py-2 bg-black text-white text-sm font-semibold tracking-wide hover:bg-gray-800 shadow-sm disabled:opacity-50"\n\s*>/g,
    '<button\n                            type="submit"\n                            form="ticket-form"\n                            disabled={loading || (!ticket && !initialComment.trim())}\n                            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wide hover:bg-gray-800 shadow-sm hover:shadow-md disabled:opacity-50 transition-all rounded-none"\n                        >'
);
content = content.replace(
    /<button\n\s*type="button"\n\s*onClick={handleDelete}\n\s*className="flex items-center text-red-600 hover:text-red-700 text-sm font-semibold tracking-wide"\n\s*>/g,
    '<button\n                            type="button"\n                            onClick={handleDelete}\n                            className="flex items-center text-red-600 hover:text-red-700 text-xs font-bold uppercase tracking-wide transition-colors"\n                        >'
);

fs.writeFileSync(file, content, 'utf8');

// CommentSection updates
const commentFile = './src/components/board/CommentSection.tsx';
let commentContent = fs.readFileSync(commentFile, 'utf8');

commentContent = commentContent.replace(
    /className="flex flex-col h-\[400px\] bg-gray-50 border border-gray-200"/g,
    'className="flex flex-col h-[400px] bg-white border border-black"'
);
commentContent = commentContent.replace(
    /className="p-4 border-b border-gray-200 bg-white"/g,
    'className="p-4 border-b border-black bg-white"'
);
commentContent = commentContent.replace(
    /<h4 className="font-semibold text-gray-800">Comments<\/h4>/g,
    '<h4 className="text-sm font-bold text-black uppercase tracking-wide">Comments</h4>'
);
commentContent = commentContent.replace(
    /className={`max-w-\[80%\] p-3 text-sm \${comment.user_id === user\?.id\n\s*\? 'bg-blue-600 text-white'\n\s*: 'bg-white border border-gray-200 text-gray-800'\n\s*}`}/g,
    'className={`max-w-[80%] p-3 text-sm rounded-none border border-black ${comment.user_id === user?.id\n                                    ? \'bg-black text-white\'\n                                    : \'bg-white text-gray-900\'\n                                    }`}'
);
commentContent = commentContent.replace(
    /className={`text-xs mb-1 font-medium \${comment.user_id === user\?.id \? 'text-blue-200' : 'text-gray-500'/g,
    'className={`text-xs mb-1 font-bold tracking-wide uppercase ${comment.user_id === user?.id ? \'text-gray-400\' : \'text-gray-500\''
);
commentContent = commentContent.replace(
    /<div className="w-8 h-8 bg-blue-100 flex items-center justify-center text-blue-600">/g,
    '<div className="w-8 h-8 bg-gray-100 border border-black flex items-center justify-center text-black rounded-none">'
);
commentContent = commentContent.replace(
    /className="flex-1 px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"/g,
    'className="flex-1 px-4 py-2 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none transition-colors"'
);
commentContent = commentContent.replace(
    /className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"/g,
    'className="px-4 py-2 bg-black text-white hover:bg-gray-800 border border-black disabled:opacity-50 transition-colors rounded-none"'
);

fs.writeFileSync(commentFile, commentContent, 'utf8');

console.log("Updated TicketModal and CommentSection");
