import React, { useState } from 'react';
import { FaChartBar, FaInfoCircle, FaShare, FaDownload } from 'react-icons/fa';
import './ResultsView.css';

function ResultsView({ result, onShare, onSave }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!result) return null;
  
  // Handle data from both original and enhanced schema
  const { 
    timestamp, 
    skinScore, 
    skinAge, 
    skinType, 
    skinTone,
    skinConditions,
    conditions,
    metrics,
    recommendations,
    overallScore
  } = result;
  
  // Support both schema versions
  const score = overallScore || skinScore || 0;
  
  // Handle skinType being either a string or an object
  const skinTypeValue = typeof skinType === 'object' ? skinType.type : skinType;
  const skinTypeDescription = typeof skinType === 'object' ? skinType.description : '';
  
  // Handle conditions from both schemas
  const displayConditions = conditions || skinConditions || [];
  
  // Handle metrics with fallback for older structure
  const displayMetrics = {
    moisture: metrics?.moisture || metrics?.smoothness || 0,
    oiliness: metrics?.oiliness || metrics?.elasticity || 0,
    sensitivity: metrics?.sensitivity || 0,
    pigmentation: metrics?.pigmentation || metrics?.homogeneity || 0,
    wrinkles: metrics?.wrinkles || metrics?.fineness || 0,
    pores: metrics?.pores || 0
  };
  
  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get skin type class for styling
  const getSkinTypeClass = (type) => {
    switch (type) {
      case 'dry': return 'dry';
      case 'oily': return 'oily';
      case 'combination': return 'combination';
      case 'normal': return 'normal';
      case 'sensitive': return 'sensitive';
      default: return '';
    }
  };
  
  // Get condition class for styling
  const getConditionClass = (condition) => {
    switch (condition) {
      case 'sensitivity': return 'sensitivity';
      case 'acne': return 'acne';
      case 'dark-circles': return 'dark-circles';
      case 'wrinkles': return 'wrinkles';
      case 'comedones': return 'comedones';
      default: return '';
    }
  };
  
  return (
    <div className="results-view">
      {/* Report Header */}
      <div className="report-header">
        <h2>Your skin report</h2>
        <div className="report-date">
          {formatDate(timestamp)}
        </div>
      </div>
      
      {/* Report Tabs */}
      <div className="report-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'skin-type' ? 'active' : ''}`}
          onClick={() => setActiveTab('skin-type')}
        >
          Skin Type
        </button>
        <button 
          className={`tab-button ${activeTab === 'conditions' ? 'active' : ''}`}
          onClick={() => setActiveTab('conditions')}
        >
          Conditions
        </button>
        <button 
          className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="user-info">
              <div className="user-avatar">
                {result.userName?.charAt(0) || 'U'}
              </div>
              <div className="user-name">
                {result.userName || 'User'}
              </div>
            </div>
            
            <div className="overview-message">
              {skinScore > 80 
                ? 'Your skin is amazing. Stick to your current skincare routines.'
                : skinScore > 60
                ? 'Your skin is in good condition. Minor improvements could help.'
                : 'Your skin needs attention. Follow our recommendations.'}
            </div>
            
            <div className="score-metrics">
              <div className="score-box">
                <div className="score-number">{score}<span>%</span></div>
                <div className="score-label">Skin Score</div>
              </div>
              
              <div className="score-box">
                <div className="score-value">{skinAge}</div>
                <div className="score-label">Skin age</div>
              </div>
            </div>
            
            <div className="metrics-chart">
              <h3>Skin Metrics</h3>
              <div className="hexagon-chart">
                {Object.keys(displayMetrics).map(key => (
                  <div key={key} className="metric">
                    <div className="metric-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                    <div className="metric-bar">
                      <div className="metric-fill" style={{width: `${displayMetrics[key]}%`}}></div>
                    </div>
                    <div className="metric-value">{displayMetrics[key]}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Skin Type Tab */}
        {activeTab === 'skin-type' && (
          <div className="skin-type-tab">
            <h3>Your skin</h3>
            <p className="skin-type-description">
              You can view and edit your skin information in profile setting
            </p>
            
            <div className="skin-type-section">
              <h4>Type</h4>
              <div className="skin-type-badge">
                <div className={`skin-type-icon ${getSkinTypeClass(skinTypeValue)}`}></div>
                <div className="skin-type-info">
                  <h3>{skinTypeValue}</h3>
                  <p>{skinTypeDescription || 'Your primary skin type'}</p>
                </div>
              </div>
            </div>
            
            <div className="skin-type-tips">
              <h4>Tips</h4>
              {skinTypeValue === 'oily' && (
                <div className="tip-content">
                  <p>Oily skin refers to skin with excess sebum. This overproduction of sebum can clog pores and cause acne breakouts.</p>
                  <ol>
                    <li>Cleanse your face twice daily with oil-free cleansers. Don't wash or scrub your face too much, which might cause a lack of moisture and the sebaceous glands to produce more oil.</li>
                    <li>Follow up with toner after washing your face. And exfoliate your skin regularly to clear dead skin cells.</li>
                  </ol>
                </div>
              )}
              
              {skinTypeValue === 'dry' && (
                <div className="tip-content">
                  <p>Dry skin produces less sebum than normal skin, leading to a lack of moisture and natural oils needed for skin protection.</p>
                  <ol>
                    <li>Use gentle, hydrating cleansers that don't strip your skin of its natural oils.</li>
                    <li>Apply a rich moisturizer immediately after washing while your skin is still damp to lock in moisture.</li>
                  </ol>
                </div>
              )}
              
              {skinTypeValue === 'combination' && (
                <div className="tip-content">
                  <p>Combination skin features areas that are dry as well as oily—typically with an oily T-zone and drier cheeks.</p>
                  <ol>
                    <li>Use different products for different areas of your face—lighter, oil-free products for oily areas and richer products for dry areas.</li>
                    <li>Consider using a balancing toner to help normalize your skin's pH levels.</li>
                  </ol>
                </div>
              )}
              
              {skinTypeValue === 'normal' && (
                <div className="tip-content">
                  <p>Normal skin is well-balanced—neither too oily nor too dry—with good circulation and a healthy complexion.</p>
                  <ol>
                    <li>Maintain your skin's balance with gentle cleansers and lightweight moisturizers.</li>
                    <li>Don't forget sunscreen daily to protect your skin from UV damage and premature aging.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Conditions Tab */}
        {activeTab === 'conditions' && (
          <div className="conditions-tab">
            <h3>Skin conditions</h3>
            
            <div className="conditions-list">
              {displayConditions.map((condition, index) => (
                <div 
                  key={index} 
                  className={`condition-item ${condition.active ? 'active' : ''}`}
                  onClick={() => {
                    // In a real app, you might toggle or select this condition
                  }}
                >
                  <div className={`condition-icon ${condition.type}`}></div>
                  <span>{condition.name}</span>
                </div>
              ))}
            </div>
            
            {displayConditions.find(c => c.active)?.type === 'sensitivity' && (
              <div className="condition-details">
                <h4>Sensitivity</h4>
                <p className="condition-description">
                  Your skin is <strong>sensitive</strong>
                </p>
                
                <div className="sensitivity-levels">
                  <div className="level-option">
                    <div className="level-icon strong"></div>
                    <span>Strong</span>
                  </div>
                  <div className="level-option selected">
                    <div className="level-icon sensitive"></div>
                    <span>Sensitive</span>
                  </div>
                </div>
                
                <div className="condition-tips">
                  <h4>Tips</h4>
                  <p>
                    Sensitive skin is more prone to redness, itchy, and burning etc. Special care is needed for your skin to maintain a healthy glow.
                  </p>
                  <ol>
                    <li>Only use products for sensitive skin.</li>
                    <li>Always patch test new products before applying them to your face.</li>
                    <li>Avoid products with fragrances, alcohol, and other potential irritants.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            <h3>Personalized Recommendations</h3>
            
            <div className="recommendation-categories">
              <div className="category">
                <h4>Cleansers</h4>
                <div className="product-list">
                  {recommendations?.cleansers?.map((product, index) => (
                    <div key={index} className="product-card">
                      <div className="product-image-placeholder"></div>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-description">{product.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="category">
                <h4>Moisturizers</h4>
                <div className="product-list">
                  {recommendations?.moisturizers?.map((product, index) => (
                    <div key={index} className="product-card">
                      <div className="product-image-placeholder"></div>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-description">{product.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="category">
                <h4>Treatments</h4>
                <div className="product-list">
                  {recommendations?.treatments?.map((product, index) => (
                    <div key={index} className="product-card">
                      <div className="product-image-placeholder"></div>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-description">{product.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="category">
                <h4>Daily Routine</h4>
                <div className="routine-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h5>Morning Cleanse</h5>
                      <p>Use a gentle cleanser suitable for your {skinType} skin type.</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h5>Tone</h5>
                      <p>Apply alcohol-free toner to balance your skin's pH.</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h5>Moisturize</h5>
                      <p>Use a {skinType === 'oily' ? 'lightweight, oil-free' : 'hydrating'} moisturizer.</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h5>Sun Protection</h5>
                      <p>Apply broad-spectrum SPF 30+ sunscreen daily.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-action" onClick={onSave}>
          Post
        </button>
        <button className="btn-action primary" onClick={onShare}>
          Share
        </button>
      </div>
    </div>
  );
}

export default ResultsView;
