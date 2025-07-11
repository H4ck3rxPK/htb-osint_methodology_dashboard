import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, Download } from 'lucide-react';
import './OSINTDashboard.css';

interface OSINTNode {
  id: string;
  name: string;
  children: string[];
  isExpanded: boolean;
}

interface Connection {
  from: string;
  to: string;
  fromRect: { x: number; y: number; width: number; height: number };
  toRect: { x: number; y: number; width: number; height: number };
}

const OSINTDashboard: React.FC = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Core Elements (上方綠色)
  const [coreElements] = useState<OSINTNode[]>([
    {
      id: 'company-info',
      name: 'Company Information',
      isExpanded: false,
      children: ['Organization', 'Locations', 'Staff', 'Contact Information', 'Business Records', 'Services', 'Social Networks']
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure', 
      isExpanded: false,
      children: ['Domain Information', 'Public Domain Records', 'Domain Structure', 'Cloud Storage', 'Email Addresses', 'Third-Parties', 'Compounded Social Networks', 'Technologies in Use']
    },
    {
      id: 'leaks',
      name: 'Leaks',
      isExpanded: false,
      children: ['Archives', 'Internal Leaks', 'Breaches']
    }
  ]);

  // Information Resources (下方紅色，固定)
  const informationResources = [
    'Home Page', 'Files', 'Social Networks', 'Search Engines', 
    'Development Platforms', 'Forums', 'Leak Resources'
  ];

  const [expandedElements, setExpandedElements] = useState<string[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);

  const getElementRect = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  };

  const toggleExpansion = (elementId: string) => {
    setExpandedElements(prev => 
      prev.includes(elementId) 
        ? [] // 如果已展開，就關閉
        : [elementId] // 如果沒展開，就只展開這一個（關閉其他）
    );
    // 清除選擇狀態和所有連接
    setSelectedChild(null);
    setConnections([]);
  };

  const handleChildClick = (childName: string) => {
    // 如果點擊的是已選中的子項目，不要取消選擇
    if (selectedChild !== childName) {
      // 切換到新的子項目時，清除之前的連接
      setConnections([]);
      setSelectedChild(childName);
    }
  };

  const handleResourceClick = (resourceName: string) => {
    if (selectedChild) {
      // 獲取元素位置
      const fromElement = document.querySelector(`[data-child="${selectedChild}"]`);
      const toElement = document.querySelector(`[data-resource="${resourceName}"]`);
      
      if (fromElement && toElement) {
        const fromRect = getElementRect(fromElement);
        const toRect = getElementRect(toElement);
        
        const newConnection: Connection = {
          from: selectedChild,
          to: resourceName,
          fromRect,
          toRect
        };
        
        // 檢查是否已存在相同連接
        const connectionExists = connections.some(
          conn => conn.from === newConnection.from && conn.to === newConnection.to
        );
        
        if (!connectionExists) {
          setConnections(prev => [...prev, newConnection]);
        }
      }
    }
  };
  
  const handleExport = async () => {
  if (connections.length === 0) return;

  // 使用組合內容產生固定的 exportId
  const sortedResources = connections.map(conn => conn.to).sort().join('-');
  const combinationKey = `${expandedElements[0]}-${selectedChild}-${sortedResources}`;
  const exportId = btoa(combinationKey).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20); // 限制長度

  console.log('Generated exportId:', exportId, 'for combination:', combinationKey);

  // 準備導出數據
  const exportData = {
    exportId: exportId,
    timestamp: new Date(),
    coreElement: expandedElements[0],
    selectedChild: selectedChild,
    connections: connections,
    connectedResources: connections.map(conn => conn.to)
  };

  try {
    // 檢查是否已存在相同組合
    const checkResponse = await fetch(`http://192.168.3.121:5000/api/exports/${exportId}`);
    
    if (checkResponse.ok) {
      // 如果已存在，直接使用現有數據
      const existingData = await checkResponse.json();
      console.log('找到現有數據:', existingData);
      localStorage.setItem('osint-export-data', JSON.stringify(existingData));
    } else {
      // 如果不存在，創建新的
      const response = await fetch('http://192.168.3.121:5000/api/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('創建新數據:', savedData);
        localStorage.setItem('osint-export-data', JSON.stringify(savedData));
      } else {
        console.error('保存失敗:', response.statusText);
        alert('保存數據失敗，請檢查後端服務是否運行');
        return;
      }
    }

    // 開啟新分頁
    window.open('/tasks', '_blank');
    
  } catch (error) {
    console.error('連接後端失敗:', error);
    alert('無法連接到後端服務');
  }
};

  // 更新連接線位置（當窗口大小改變時）
  useEffect(() => {
    const updateConnections = () => {
      setConnections(prev => prev.map(conn => {
        const fromElement = document.querySelector(`[data-child="${conn.from}"]`);
        const toElement = document.querySelector(`[data-resource="${conn.to}"]`);
        
        if (fromElement && toElement) {
          return {
            ...conn,
            fromRect: getElementRect(fromElement),
            toRect: getElementRect(toElement)
          };
        }
        return conn;
      }));
    };

    window.addEventListener('resize', updateConnections);
    return () => window.removeEventListener('resize', updateConnections);
  }, []);

  return (
    <div className="osint-dashboard" ref={dashboardRef}>
      {/* 主標題 */}
      <div className="main-title">
        Core Elements
      </div>

      {/* Core Elements (上方) */}
      <div className="core-elements-section">
        <div className="elements-row">
          {coreElements.map(element => (
            <div key={element.id} className="core-element-container">
              <div 
                className="core-element" 
                onClick={() => toggleExpansion(element.id)}
		data-element-id={element.id}
              >
                <span className="element-name">{element.name}</span>
                <span className="expand-icon">
                  {expandedElements.includes(element.id) ? 
                    <ChevronDown size={16} /> : <ChevronRight size={16} />
                  }
                </span>
              </div>
              
              {/* 展開的子項目 */}
              {expandedElements.includes(element.id) && (
                <div className="expanded-children">
                  {element.children.map((child, index) => (
                    <div 
                      key={index} 
                      className={`child-item ${selectedChild === child ? 'selected' : ''}`}
                      onClick={() => handleChildClick(child)}
                      data-child={child}
                    >
                      {child}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 中間留白區域 */}
      <div className="connection-area"></div>

      {/* Information Resources (下方) */}
      <div className="resources-section">
        <div className="resources-row">
          {informationResources.map((resource, index) => (
            <div 
              key={index} 
              className={`information-resource ${
                connections.some(conn => conn.to === resource) ? 'connected' : ''
              }`}
              onClick={() => handleResourceClick(resource)}
              data-resource={resource}
            >
              {resource}
            </div>
          ))}
        </div>
      </div>

      {/* SVG 連接線 */}
      <svg className="connection-svg" width="100%" height="100%">
        {connections.map((connection, index) => {
          const fromX = connection.fromRect.x + connection.fromRect.width / 2;
          const fromY = connection.fromRect.y + connection.fromRect.height;
          const toX = connection.toRect.x + connection.toRect.width / 2;
          const toY = connection.toRect.y;
          
	  //console.log('Drawing line:', { fromX, fromY, toX, toY });

          return (
            <line
              key={index}
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke="#ffa500"
              strokeWidth="3"
              opacity="0.8"
            />
          );
        })}
	{/* 測試線條 */}
	{/*<line x1="100" y1="100" x2="200" y2="200" stroke="#ffa500" strokeWidth="3" />*/}
{/* 綠色線條：Core Elements 到展開的父節點 */}
{expandedElements.length > 0 && (() => {
  const coreElementsTitle = document.querySelector('.main-title');
  const expandedParent = document.querySelector(`[data-element-id="${expandedElements[0]}"]`);

  if (coreElementsTitle && expandedParent) {
    const titleRect = getElementRect(coreElementsTitle);
    const parentRect = getElementRect(expandedParent);

    const titleX = titleRect.x + titleRect.width / 2;
    const titleY = titleRect.y + titleRect.height;
    const parentX = parentRect.x + parentRect.width / 2;
    const parentY = parentRect.y;

    // 檢查是否是 Infrastructure（強制垂直對齊）
    const isInfrastructure = expandedElements[0] === 'infrastructure';

    if (isInfrastructure) {
      // 強制使用標題的 X 座標，確保完全垂直
      return (
        <line
          key="core-to-infrastructure"
          x1={titleX}
          y1={titleY}
          x2={titleX}
          y2={parentY}
          stroke="#9fef00"
          strokeWidth="3"
          opacity="0.8"
        />
      );
    } else {
      // 直角彎曲線條（適用於左右兩側的父節點）
      const midY = titleY + (parentY - titleY) / 2;

      return (
        <g key="core-to-parent-angled">
          {/* 垂直線：從標題向下 */}
          <line
            x1={titleX}
            y1={titleY}
            x2={titleX}
            y2={midY}
            stroke="#9fef00"
            strokeWidth="3"
            opacity="0.8"
          />
          {/* 水平線：從標題位置到父節點位置 */}
          <line
            x1={titleX}
            y1={midY}
            x2={parentX}
            y2={midY}
            stroke="#9fef00"
            strokeWidth="3"
            opacity="0.8"
          />
          {/* 垂直線：到父節點 */}
          <line
            x1={parentX}
            y1={midY}
            x2={parentX}
            y2={parentY}
            stroke="#9fef00"
            strokeWidth="3"
            opacity="0.8"
          />
        </g>
      );
    }
  }
  return null;
})()}
	</svg>


      {/* 選擇狀態提示 */}
      {selectedChild && (
        <div className="selection-hint">
          已選擇: <span className="selected-item">{selectedChild}</span>
        </div>
      )}

      {/* Export 按鈕 */}
      <div className="export-section">
        <button
    	  className="export-btn"
    	  disabled={connections.length === 0}
    	  onClick={handleExport}
  	>
    	  <Download size={16} />
    	  Export Methodology ({connections.length} connections)
  	</button>
      </div>
    </div>
  );
};

export default OSINTDashboard;
