
import React, { useState, useCallback, useEffect } from 'react';
import { fetchWordDetails } from './services/geminiService';
import type { WordDetails, SavedWord } from './types';
import Quadrant from './components/Quadrant';
import { SearchIcon, PlusIcon, BookOpenIcon, SpeakerWaveIcon, BranchIcon, UsersIcon, EyeIcon, BookmarkIcon, ListBulletIcon, TrashIcon, XMarkIcon } from './components/icons';

const SkeletonLoader: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
    </div>
);

const SavedWordsSidebar: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    savedWords: SavedWord[];
    onSelect: (word: SavedWord) => void;
    onDelete: (word: string) => void;
}> = ({ isOpen, onClose, savedWords, onSelect, onDelete }) => (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'visible' : 'invisible'}`}>
        <div onClick={onClose} className={`absolute inset-0 bg-black/60 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`relative flex flex-col h-full w-full max-w-sm bg-white dark:bg-slate-800 shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold">Saved Words</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {savedWords.length === 0 ? (
                    <p className="p-6 text-center text-slate-500 dark:text-slate-400">You haven't saved any words yet.</p>
                ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {savedWords.map((savedWord) => (
                            <li key={savedWord.word} className="flex items-center justify-between p-4 group hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <button onClick={() => onSelect(savedWord)} className="text-left flex-grow">
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{savedWord.word}</span>
                                </button>
                                <button onClick={() => onDelete(savedWord.word)} className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
    const [wordToSearch, setWordToSearch] = useState('');
    const [currentWord, setCurrentWord] = useState<string | null>(null);
    const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
    const [similarWords, setSimilarWords] = useState<string[]>([]);
    const [newSimilarWord, setNewSimilarWord] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const LOCAL_STORAGE_KEY = 'vocabulary-quadrant-saved-words';

    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                setSavedWords(JSON.parse(saved));
            }
        } catch (error) {
            console.error("Failed to load saved words from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedWords));
        } catch (error) {
            console.error("Failed to save words to localStorage", error);
        }
    }, [savedWords]);

    const executeSearch = useCallback(async (wordToQuery: string) => {
        if (!wordToQuery.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setWordDetails(null);
        window.scrollTo(0, 0);

        const lowercasedWord = wordToQuery.trim().toLowerCase();
        setCurrentWord(lowercasedWord);
        setSimilarWords([]); // Reset user-added similar words for the new search
        
        try {
            const details = await fetchWordDetails(lowercasedWord);
            setWordDetails(details);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setCurrentWord(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeSearch(wordToSearch);
    };

    const handleDoubleClickWord = (word: string) => {
        setWordToSearch(word);
        executeSearch(word);
    };

    const handleAddSimilarWord = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSimilarWord.trim() && !similarWords.includes(newSimilarWord.trim())) {
            setSimilarWords(prev => [...prev, newSimilarWord.trim()]);
            setNewSimilarWord('');
        }
    };
    
    const handleSaveWord = () => {
        if (currentWord && wordDetails && !savedWords.some(sw => sw.word === currentWord)) {
            const newSavedWord: SavedWord = {
                word: currentWord,
                details: wordDetails,
                similarWords: similarWords,
            };
            setSavedWords(prev => [newSavedWord, ...prev]);
        }
    };
    
    const handleSelectSavedWord = (savedWord: SavedWord) => {
        setCurrentWord(savedWord.word);
        setWordDetails(savedWord.details);
        setSimilarWords(savedWord.similarWords);
        setWordToSearch(savedWord.word);
        setIsSidebarOpen(false);
        setError(null);
        setIsLoading(false);
        window.scrollTo(0, 0);
    };
    
    const handleDeleteWord = (wordToDelete: string) => {
        setSavedWords(prev => prev.filter(sw => sw.word !== wordToDelete));
    };


    const iconClasses = "h-6 w-6 text-indigo-500 dark:text-indigo-400";
    const searchableWordClass = "font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline transition";
    const isWordSaved = currentWord ? savedWords.some(sw => sw.word === currentWord) : false;

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <SavedWordsSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                savedWords={savedWords}
                onSelect={handleSelectSavedWord}
                onDelete={handleDeleteWord}
            />

            <header className="max-w-7xl mx-auto mb-8 text-center relative">
                <button onClick={() => setIsSidebarOpen(true)} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <ListBulletIcon className="h-5 w-5"/>
                    <span className="hidden md:inline font-semibold">Saved Words</span>
                </button>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-2">
                    Vocabulary Quadrant
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    Deepen your word knowledge, one search at a time.
                </p>
            </header>

            <div className="max-w-3xl mx-auto mb-8">
                <form onSubmit={handleFormSubmit} className="relative flex items-center">
                    <input
                        type="text"
                        value={wordToSearch}
                        onChange={(e) => setWordToSearch(e.target.value)}
                        placeholder="Enter a word..."
                        className="w-full pl-5 pr-20 py-3 text-lg bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-full focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition duration-300"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !wordToSearch.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white font-bold py-2 px-5 rounded-full transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '...' : <SearchIcon className="h-5 w-5" />}
                        <span className="ml-2 hidden sm:inline">Search</span>
                    </button>
                </form>
            </div>
            
            <main className="max-w-7xl mx-auto">
                {error && (
                    <div className="text-center p-8 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
                        <p className="font-bold text-lg">Oops! Something went wrong.</p>
                        <p>{error}</p>
                    </div>
                )}

                {!isLoading && !wordDetails && !error && (
                    <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                        <BookOpenIcon className="h-16 w-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Welcome!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Search for a word to begin your learning journey.
                        </p>
                    </div>
                )}
                
                {(isLoading || wordDetails) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        <Quadrant title="Word Details" icon={<BookOpenIcon className={iconClasses} />}>
                            {isLoading ? <SkeletonLoader /> : wordDetails && (
                                <div className="space-y-4 text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <div className='flex items-baseline gap-3'>
                                            <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 capitalize">{currentWord}</h3>
                                            <span className="font-semibold text-slate-500 dark:text-slate-400 italic">{wordDetails.pos}</span>
                                        </div>
                                        <button onClick={handleSaveWord} disabled={isWordSaved} title={isWordSaved ? "Word Saved" : "Save Word"} className="p-2 rounded-full disabled:cursor-not-allowed disabled:text-slate-400 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 dark:disabled:text-slate-600">
                                            <BookmarkIcon className="h-6 w-6" solid={isWordSaved}/>
                                        </button>
                                    </div>
                                    <p><strong className="font-semibold text-slate-700 dark:text-slate-200">Syllables:</strong> {wordDetails.syllabification}</p>
                                    <p className="flex items-center"><SpeakerWaveIcon className="h-5 w-5 mr-2 text-slate-500" /> <strong className="font-semibold text-slate-700 dark:text-slate-200 mr-2">Pronunciation:</strong> <span className="font-mono">{wordDetails.pronunciation}</span></p>
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-200">Common Meaning:</h4>
                                        <p>{wordDetails.commonMeaning}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-200">Etymological Meaning:</h4>
                                        <p className="text-sm italic">{wordDetails.etymologicalMeaning}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2">Examples (Primary Form):</h4>
                                        <ul className="list-disc list-inside space-y-3 pl-2">
                                            {wordDetails.examples.map((ex, i) => (
                                                <li key={i}>
                                                  <span>{ex.sentence}</span>
                                                  <br />
                                                  <span className="text-sm text-slate-500 dark:text-slate-400 italic">{ex.translation}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2">Other Forms:</h4>
                                        <div className="space-y-3">
                                            {wordDetails.forms.map((form, i) => (
                                                 <div key={i} className="p-3 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600/50">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                        <span onDoubleClick={() => handleDoubleClickWord(form.word)} className={searchableWordClass}>{form.word}</span>
                                                        <span className="ml-2 font-normal text-sm italic text-slate-500 dark:text-slate-400">({form.pos})</span>
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{form.definition}</p>
                                                    <div className="mt-2 pl-3 border-l-2 border-indigo-300 dark:border-indigo-600 text-slate-600 dark:text-slate-300 text-sm">
                                                        <p className="font-medium">{form.example}</p>
                                                        <p className="text-slate-500 dark:text-slate-400 italic">{form.exampleTranslation}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Quadrant>

                        <Quadrant title="Etymology & Roots" icon={<BranchIcon className={iconClasses} />}>
                            {isLoading ? <SkeletonLoader /> : wordDetails && (
                                <div className="space-y-4 text-slate-600 dark:text-slate-300">
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Root:</h4>
                                        <p>
                                            <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{wordDetails.etymology.root}</span>
                                            <span className="text-sm ml-2 text-slate-500 dark:text-slate-400">({wordDetails.etymology.rootSource})</span>
                                            <span> &ndash; </span>
                                            <span className="italic">{wordDetails.etymology.rootMeaning}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Root Development:</h4>
                                        <p className="text-sm">{wordDetails.etymology.rootDevelopment}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2">Related Words:</h4>
                                        <ul className="space-y-3">
                                            {wordDetails.etymology.relatedWords.map((related, i) => (
                                                <li key={i} className="p-3 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600/50">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                        <span onDoubleClick={() => handleDoubleClickWord(related.word)} className={searchableWordClass}>{related.word}</span>
                                                        <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">({related.translation})</span>
                                                    </p>
                                                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1 font-mono bg-indigo-50 dark:bg-indigo-900/30 p-1 rounded">
                                                        {related.breakdown}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </Quadrant>

                        <Quadrant title="Synonyms" icon={<UsersIcon className={iconClasses} />}>
                             {isLoading ? <SkeletonLoader /> : wordDetails && (
                                <div className="space-y-4">
                                    {wordDetails.synonyms.map((syn, i) => (
                                        <div key={i} className="p-3 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600/50">
                                            <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                                               <span onDoubleClick={() => handleDoubleClickWord(syn.word)} className={searchableWordClass}>{syn.word}</span>
                                            </p>
                                            <p className="mt-1 text-slate-600 dark:text-slate-300">{syn.usageDifference}</p>
                                            <div className="mt-2 pl-3 border-l-2 border-indigo-300 dark:border-indigo-600 text-slate-600 dark:text-slate-300">
                                                <p className="text-sm font-medium">{syn.example}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">{syn.exampleTranslation}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {wordDetails.synonyms.length === 0 && (
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">No synonyms with detailed usage were found.</p>
                                    )}
                                </div>
                            )}
                        </Quadrant>

                        <Quadrant title="Similar Looking Words" icon={<EyeIcon className={iconClasses} />}>
                             {isLoading ? <SkeletonLoader /> : wordDetails && (
                                <>
                                    <form onSubmit={handleAddSimilarWord} className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={newSimilarWord}
                                            onChange={(e) => setNewSimilarWord(e.target.value)}
                                            placeholder="Add your own..."
                                            className="flex-grow bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition duration-300"
                                        />
                                        <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-md disabled:bg-slate-400 dark:disabled:bg-slate-600" disabled={!newSimilarWord.trim()}>
                                            <PlusIcon className="h-5 w-5" />
                                        </button>
                                    </form>

                                    {wordDetails.confusableWords?.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Commonly Confused</h4>
                                            <div className="space-y-3">
                                                {wordDetails.confusableWords.map((item, i) => (
                                                    <div key={`confuse-${i}`} className="p-2 rounded-lg transition hover:bg-slate-100 dark:hover:bg-slate-700/50" onDoubleClick={() => handleDoubleClickWord(item.word)}>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-100 cursor-pointer">
                                                           <span className={searchableWordClass}>{item.word}</span> <span className="ml-2 font-normal text-sm italic text-slate-500 dark:text-slate-400">({item.pos})</span>
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300">{item.definition}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">My List</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {similarWords.map((word, i) => (
                                                <span key={`user-${i}`} onDoubleClick={() => handleDoubleClickWord(word)} className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800/60 transition">{word}</span>
                                            ))}
                                            {similarWords.length === 0 && (
                                                <p className="text-slate-500 dark:text-slate-400 text-sm">Add words that you find visually similar to help with recall.</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                             )}
                        </Quadrant>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;