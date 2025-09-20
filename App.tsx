
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TopicSelector } from './components/TopicSelector';
import { ModuleSelector } from './components/ModuleSelector';
import { ContentView } from './components/ContentView';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateModules, generateModuleContent } from './services/geminiService';
import { Module, AppStep } from './types';
import { GRADE_LEVELS } from './constants';

const App: React.FC = () => {
    const [step, setStep] = useState<AppStep>(AppStep.TOPIC_SELECTION);
    const [topic, setTopic] = useState<string>('');
    const [gradeLevel, setGradeLevel] = useState<string>(GRADE_LEVELS[2]);
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateModules = useCallback(async () => {
        if (!topic) {
            setError('Please enter a topic.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const generatedModules = await generateModules(topic, gradeLevel);
            setModules(generatedModules);
            setStep(AppStep.MODULE_SELECTION);
        } catch (err) {
            setError('Failed to generate learning modules. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [topic, gradeLevel]);

    const handleSelectModule = useCallback(async (module: Module) => {
        setSelectedModule(module);
        setIsLoading(true);
        setError(null);
        try {
            const generatedContent = await generateModuleContent(module.title, module.description, gradeLevel);
            setContent(generatedContent);
            setStep(AppStep.CONTENT_VIEW);
        } catch (err) {
            setError('Failed to generate module content. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [gradeLevel]);

    const handleBackToModules = () => {
        setContent('');
        setSelectedModule(null);
        setStep(AppStep.MODULE_SELECTION);
    };
    
    const handleBackToTopic = () => {
        setModules([]);
        setStep(AppStep.TOPIC_SELECTION);
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner />;
        }
        if (error) {
            return (
                <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-lg">
                    <p>{error}</p>
                    <button 
                        onClick={() => setStep(AppStep.TOPIC_SELECTION)}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Start Over
                    </button>
                </div>
            );
        }

        switch (step) {
            case AppStep.TOPIC_SELECTION:
                return (
                    <TopicSelector
                        topic={topic}
                        setTopic={setTopic}
                        gradeLevel={gradeLevel}
                        setGradeLevel={setGradeLevel}
                        onSubmit={handleGenerateModules}
                    />
                );
            case AppStep.MODULE_SELECTION:
                return (
                    <ModuleSelector
                        topic={topic}
                        gradeLevel={gradeLevel}
                        modules={modules}
                        onSelectModule={handleSelectModule}
                        onBack={handleBackToTopic}
                    />
                );
            case AppStep.CONTENT_VIEW:
                if (selectedModule) {
                    return (
                        <ContentView
                            module={selectedModule}
                            content={content}
                            onBack={handleBackToModules}
                        />
                    );
                }
                // Fallback to topic selection if something is wrong
                setStep(AppStep.TOPIC_SELECTION);
                return null;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default App;
