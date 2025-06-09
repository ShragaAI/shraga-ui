import React, { createContext, useContext, ReactNode } from 'react';

interface ComponentsContextType {
    ChatComponent?: React.ComponentType<any>;
}

const ComponentsContext = createContext<ComponentsContextType>({});

interface ComponentsProviderProps {
    children: ReactNode;
    chatComponent?: React.ComponentType<any>;
}

export const ComponentsProvider = ({
    children,
    chatComponent,
}: ComponentsProviderProps) => {
    const value = {
        ChatComponent: chatComponent,
    };

    return (
        <ComponentsContext.Provider value={value}>
            {children}
        </ComponentsContext.Provider>
    );
};

export const useComponents = () => {
    const context = useContext(ComponentsContext);
    return context;
};

export default ComponentsContext;