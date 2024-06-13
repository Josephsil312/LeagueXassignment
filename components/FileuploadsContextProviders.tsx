
import React, { PropsWithChildren, createContext, useContext, useState } from 'react';

// Define the context
type TasksContextType = {
    fileList: FileItem[];
    setFileList: React.Dispatch<React.SetStateAction<FileItem[]>>;
    updateFileStatus: (fileId: string, status: 'uploading' | 'uploaded' | 'failed' | 'cancelled') => void;
    selectedFile: FileItem | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileItem | null>>;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);

// Define the file item interface
interface FileItem {
    fileName: string;
    fileType: string;
    fileURL: string;
    id: string;
    status: 'uploading' | 'uploaded' | 'failed' | 'cancelled';
    uploadTask?: any;
    
}

// Context provider component
const TasksContextProvider = ({ children }: PropsWithChildren<{}>) => {
    const [fileList, setFileList] = useState<FileItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    // Function to update file status
    const updateFileStatus = (fileId: string, status: 'uploading' | 'uploaded' | 'failed' | 'cancelled') => {
        setFileList(prevFileList =>
            prevFileList.map(file =>
                file.id === fileId ? { ...file, status: status } : file
            )
        );
    };

    return (
        <TasksContext.Provider value={{ fileList, setFileList, updateFileStatus,selectedFile, setSelectedFile }}>
            {children}
        </TasksContext.Provider>
    );
};

export default TasksContextProvider;
export const useTasks = () => useContext(TasksContext)
