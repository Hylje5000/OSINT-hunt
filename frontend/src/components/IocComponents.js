import React from 'react';
import axios from 'axios';
import './IocsTab.css';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Format hunting query to properly display line breaks
const formatQueryText = (queryText) => {
  if (!queryText) return '';
  // Replace literal \n strings with actual line breaks
  return queryText.replace(/\\n/g, '\n');
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// IoC Filter Component
export const IocsFilter = ({ filterType, setFilterType, iocTypes }) => (
  <div className="iocs-controls">
    <div className="iocs-filter">
      <label htmlFor="type-filter">Filter by type: </label>
      <select 
        id="type-filter" 
        value={filterType} 
        onChange={(e) => setFilterType(e.target.value)}
      >
        {iocTypes.map(type => (
          <option key={type} value={type}>
            {type === 'all' ? 'All Types' : type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </option>
        ))}
      </select>
    </div>
  </div>
);

// IoC Status Message Component
export const StatusMessage = ({ loading, error, showSuccessMessage }) => (
  <>
    {loading && <p className="loading-message">Loading IoCs...</p>}
    {error && <p className="error-message">{error}</p>}
    {showSuccessMessage && (
      <div className="success-message">
        ✅ Hunting queries were successfully generated and saved to the database!
      </div>
    )}
  </>
);

// Hunting Query Item Component
export const HuntingQueryItem = ({ query, iocValue, onDelete }) => (
  <div className="hunting-query-item" key={query.id}>
    <div className="query-header">
      <h5>{query.name}</h5>
      <div className="query-actions">
        <small className="query-date">Created: {formatDate(query.created_at)}</small>
        <button 
          className="delete-query-button"
          onClick={() => onDelete(query.id, iocValue)}
        >
          Delete
        </button>
      </div>
    </div>
    <pre className="query-code">{formatQueryText(query.query_text)}</pre>
  </div>
);

// Hunting Queries List Component
export const HuntingQueries = ({ 
  ioc, 
  iocQueries, 
  onDelete, 
  onGenerateQuery, 
  generatingSingleQuery 
}) => (
  <div className="ioc-hunting-rules">
    <div className="hunting-rules-header">
      <h4>Hunting Queries</h4>
      <button
        className="generate-query-button"
        disabled={generatingSingleQuery}
        onClick={() => onGenerateQuery(ioc)}
      >
        {generatingSingleQuery ? 'Generating...' : 'Generate Query'}
      </button>
    </div>
    
    {iocQueries[ioc.value] && iocQueries[ioc.value].length > 0 ? (
      <div className="hunting-queries-list">
        {iocQueries[ioc.value].map(query => (
          <HuntingQueryItem 
            key={query.id}
            query={query} 
            iocValue={ioc.value} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    ) : (
      <p className="no-queries-message">
        No hunting queries found for this IoC. Click "Generate Query" to create one.
      </p>
    )}
  </div>
);

// IoC Details Component
export const IocDetails = ({ 
  ioc, 
  iocQueries, 
  onDeleteQuery, 
  onGenerateQuery, 
  generatingSingleQuery 
}) => (
  <tr className="details-row">
    <td colSpan="5">
      <div className="ioc-details">
        <HuntingQueries 
          ioc={ioc}
          iocQueries={iocQueries}
          onDelete={onDeleteQuery}
          onGenerateQuery={onGenerateQuery}
          generatingSingleQuery={generatingSingleQuery}
        />
      </div>
    </td>
  </tr>
);

// IoC Table Row Component
export const IocsTableRow = ({ 
  ioc, 
  expandedIoc, 
  toggleExpand, 
  selectedIocs, 
  toggleIocSelection,
  iocQueries,
  onDeleteQuery,
  onGenerateQuery,
  generatingSingleQuery
}) => (
  <React.Fragment>
    <tr className={expandedIoc === ioc.value ? 'expanded' : ''}>
      <td className="checkbox-column">
        <input 
          type="checkbox"
          checked={selectedIocs.some(selected => selected.value === ioc.value)}
          onChange={() => toggleIocSelection(ioc)}
        />
      </td>
      <td className="ioc-value">{ioc.value}</td>
      <td className="ioc-type">
        <span className="type-badge">
          {ioc.type_name || ioc.type}
        </span>
      </td>
      <td className="ioc-description">
        {ioc.description || <span className="no-desc">No description</span>}
      </td>
      <td className="ioc-actions">
        <button 
          className="detail-button"
          onClick={() => toggleExpand(ioc.value)}
        >
          {expandedIoc === ioc.value ? 'Hide Details' : 'Show Details'}
        </button>
      </td>
    </tr>
    {expandedIoc === ioc.value && (
      <IocDetails 
        ioc={ioc} 
        iocQueries={iocQueries}
        onDeleteQuery={onDeleteQuery}
        onGenerateQuery={onGenerateQuery}
        generatingSingleQuery={generatingSingleQuery}
      />
    )}
  </React.Fragment>
);

// IoCs Table Component
export const IocsTable = ({ 
  filteredIocs, 
  expandedIoc, 
  toggleExpand, 
  selectedIocs, 
  toggleIocSelection, 
  allFilteredSelected, 
  toggleSelectAll,
  iocQueries,
  onDeleteQuery,
  onGenerateQuery,
  generatingSingleQuery
}) => (
  <div className="table-responsive">
    <table className="iocs-table">
      <thead>
        <tr>
          <th className="checkbox-column">
            <input 
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
            />
          </th>
          <th>Value</th>
          <th>Type</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredIocs.map((ioc, index) => (
          <IocsTableRow 
            key={index}
            ioc={ioc}
            expandedIoc={expandedIoc}
            toggleExpand={toggleExpand}
            selectedIocs={selectedIocs}
            toggleIocSelection={toggleIocSelection}
            iocQueries={iocQueries}
            onDeleteQuery={onDeleteQuery}
            onGenerateQuery={onGenerateQuery}
            generatingSingleQuery={generatingSingleQuery}
          />
        ))}
      </tbody>
    </table>
  </div>
);

// Helper functions that can be exported for reuse
export const fetchIocQueries = async (iocValue) => {
  try {
    const response = await axios.get(`${API_URL}/api/iocs/${encodeURIComponent(iocValue)}/hunting_queries`);
    return response.data.hunting_queries;
  } catch (err) {
    console.error('Error fetching hunting queries for IoC:', err);
    return [];
  }
};