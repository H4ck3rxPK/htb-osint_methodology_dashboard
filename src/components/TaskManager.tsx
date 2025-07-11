import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, ArrowLeft } from 'lucide-react';
import './TaskManager.css';

interface ExportData {
  exportId: string;
  timestamp: Date;
  coreElement: string;
  selectedChild: string;
  connections: any[];
  connectedResources: string[];
}

interface Task {
  taskId: string;
  author: string;
  tags: string[];
  date: string;
  collectData: string;
}

const TaskManager: React.FC = () => {
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // 保存任務到後端
  const saveTasksToBackend = async (updatedTasks: Task[]) => {
    if (!exportData) return;

    try {
      const response = await fetch(`http://192.168.3.121:5000/api/exports/${exportData.exportId}/tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: updatedTasks.map(task => ({
            taskId: task.taskId,
            author: task.author,
            tags: task.tags,
            date: new Date(task.date),
            collectData: task.collectData,
            status: task.collectData ? 'completed' : 'pending'
          }))
        })
      });

      if (response.ok) {
        console.log('任務已保存到資料庫');
      } else {
        console.error('保存任務失敗:', response.statusText);
      }
    } catch (error) {
      console.error('保存任務到後端失敗:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // 從 localStorage 讀取導出的數據
      const savedData = localStorage.getItem('osint-export-data');
      if (savedData) {
        const data = JSON.parse(savedData);
        setExportData(data);

        try {
          // 從後端讀取該導出的任務數據
          const response = await fetch(`http://192.168.3.121:5000/api/exports/${data.exportId}`);
          if (response.ok) {
            const backendData = await response.json();
            if (backendData.tasks && backendData.tasks.length > 0) {
              // 轉換後端數據格式
              const convertedTasks = backendData.tasks.map((task: any) => ({
                taskId: task.taskId,
                author: task.author || '',
                tags: task.tags || data.connectedResources || [],
                date: task.date ? new Date(task.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                collectData: task.collectData || ''
              }));
              setTasks(convertedTasks);
            } else {
              // 如果沒有任務，創建初始任務
              const initialTask: Task = {
                taskId: Date.now().toString(),
                author: '',
                tags: data.connectedResources || [],
                date: new Date().toISOString().split('T')[0],
                collectData: ''
              };
              setTasks([initialTask]);
            }
          }
        } catch (error) {
          console.error('讀取後端數據失敗:', error);
          // 如果後端連接失敗，創建初始任務
          const initialTask: Task = {
            taskId: Date.now().toString(),
            author: '',
            tags: data.connectedResources || [],
            date: new Date().toISOString().split('T')[0],
            collectData: ''
          };
          setTasks([initialTask]);
        }
      }
    };

    loadData();
  }, []);

  const addNewTask = () => {
    const newTask: Task = {
      taskId: Date.now().toString(),
      author: '',
      tags: exportData?.connectedResources || [],
      date: new Date().toISOString().split('T')[0],
      collectData: ''
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasksToBackend(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.taskId !== taskId);
    setTasks(updatedTasks);
    saveTasksToBackend(updatedTasks);
  };

  const updateTask = (taskId: string, field: keyof Task, value: string) => {
    const updatedTasks = tasks.map(task =>
      task.taskId === taskId
        ? { ...task, [field]: value }
        : task
    );
    setTasks(updatedTasks);

    // 自動保存到後端（延遲保存避免頻繁請求）
    setTimeout(() => {
      saveTasksToBackend(updatedTasks);
    }, 1000);
  };

  const goBack = () => {
    window.close();
  };

  if (!exportData) {
    return <div className="task-manager loading">載入中...</div>;
  }

  return (
    <div className="task-manager">
      <div className="task-header">
        <button className="back-btn" onClick={goBack}>
          <ArrowLeft size={16} />
          返回主頁
        </button>
        <h1>任務管理 - {exportData.selectedChild}</h1>
      </div>

      <div className="module-container">
        <div
          className={`module-header ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="expand-icon">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <span className="module-name">{exportData.selectedChild}</span>
          <span className="task-count">({tasks.length} 個任務)</span>
        </div>

        {isExpanded && (
          <div className="tasks-container">
            {tasks.map(task => (
              <div key={task.taskId} className="task-form">
                <div className="task-header-row">
                  <h3>任務 #{task.taskId.slice(-4)}</h3>
                  <button
                    className="delete-btn"
                    onClick={() => deleteTask(task.taskId)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-row">
                  <label>Author:</label>
                  <input
                    type="text"
                    value={task.author}
                    onChange={(e) => updateTask(task.taskId, 'author', e.target.value)}
                    placeholder="輸入作者名稱"
                  />
                </div>

                <div className="form-row">
                  <label>Tags:</label>
                  <div className="tags-display">
                    {task.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={task.date}
                    onChange={(e) => updateTask(task.taskId, 'date', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-row-header">
                    <label>Collect Data:</label>
                    <button 
                      className="expand-toggle-btn"
                      onClick={() => toggleTaskExpansion(task.taskId)}
                      type="button"
                    >
                      {expandedTasks.includes(task.taskId) ? '標準檢視' : '大型檢視'}
                    </button>
                  </div>
                  <textarea
                    value={task.collectData}
                    onChange={(e) => updateTask(task.taskId, 'collectData', e.target.value)}
                    placeholder="輸入收集到的數據..."
                    className={expandedTasks.includes(task.taskId) ? 'expanded-textarea' : 'normal-textarea'}
                    style={{ 
                      transition: 'all 0.3s ease',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            ))}

            <button className="add-task-btn" onClick={addNewTask}>
              <Plus size={16} />
              新增任務
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
