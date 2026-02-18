import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faImage, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import globalVar from '../../public Func/globalVar';
import axios from '../../public Func/axiosAuth';
import { Button, Input, Card } from '../../components/ui';
import './CreatePost.css';

function CreatePostPage() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    communityID: '',
    mainText: '',
    date: new Date().toISOString().split('T')[0],
    hideIdentity: false,
    attachedImages: []
  });
  const [uploadingAttachedImage, setUploadingAttachedImage] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await axios.get(globalVar.backendURL + '/community/community-list');
      setCommunities(res.data || []);
      if (res.data && res.data.length > 0) {
        setFormData(prev => ({ ...prev, communityID: res.data[0].id.toString() }));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching communities:', err);
      setMessage({ type: 'error', text: 'Failed to load communities. Please try again.' });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setMessage({ type: '', text: '' });
  };

  const handleAttachedImageAdd = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    try {
      setUploadingAttachedImage(true);
      setMessage({ type: '', text: '' });

      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(
        globalVar.backendURL + '/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Response is a full URL string: "http://localhost:8001/file/1771427428652.png"
      const imageUrl = typeof res.data === 'string' ? res.data : (res.data?.link || res.data?.file || res.data?.filename || res.data);
      const fileName = file.name;
      
      setFormData(prev => ({
        ...prev,
        attachedImages: [...prev.attachedImages, { name: fileName, link: imageUrl }]
      }));
      
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
    } catch (err) {
      console.error('Error uploading image:', err);
      setMessage({
        type: 'error',
        text: err.response?.data || 'Failed to upload image. Please try again.'
      });
    } finally {
      setUploadingAttachedImage(false);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      attachedImages: prev.attachedImages.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.communityID) {
      setMessage({ type: 'error', text: 'Please select a community.' });
      return false;
    }
    if (!formData.mainText.trim()) {
      setMessage({ type: 'error', text: 'Please enter post content.' });
      return false;
    }
    if (formData.mainText.length > 1000) {
      setMessage({ type: 'error', text: 'Post content must be 1000 characters or less.' });
      return false;
    }
    if (!formData.date) {
      setMessage({ type: 'error', text: 'Please select a date.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      const payload = {
        communityID: parseInt(formData.communityID),
        mainText: formData.mainText.trim(),
        date: new Date(formData.date).toISOString(),
        hideIdentity: formData.hideIdentity,
        attachedImages: formData.attachedImages.length > 0 ? formData.attachedImages : undefined
      };

      const res = await axios.post(
        globalVar.backendURL + '/admin/create-post',
        payload
      );

      // Backend returns {status: 200, data: "Done"} on success
      if (res.status === 200 && (res.data === 'Done' || res.data === 'done' || (res.data && res.data.done))) {
        setMessage({ type: 'success', text: 'Post created successfully!' });
        setTimeout(() => {
          navigate('/posts');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: res.data || 'Failed to create post. Please try again.' });
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setMessage({
        type: 'error',
        text: err.response?.data || 'Failed to create post. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-post-page">
        <div className="loading-container">
          <p>Loading communities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        {/* Header */}
        <div className="create-post-header">
          <button
            className="back-button"
            onClick={() => navigate('/posts')}
            aria-label="Go back"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1>Create New Post</h1>
        </div>

        {/* Form */}
        <Card className="create-post-card">
          <form onSubmit={handleSubmit}>
            {/* Community Selection */}
            <div className="form-group">
              <label htmlFor="communityID">Community *</label>
              <select
                id="communityID"
                name="communityID"
                value={formData.communityID}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                {communities.map(community => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Post Content */}
            <div className="form-group">
              <label htmlFor="mainText">Post Content *</label>
              <textarea
                id="mainText"
                name="mainText"
                value={formData.mainText}
                onChange={handleInputChange}
                rows={8}
                maxLength={1000}
                required
                className="form-textarea"
                placeholder="Write your post content here..."
              />
              <div className="char-count">
                {formData.mainText.length} / 1000 characters
              </div>
            </div>

            {/* Date */}
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Hide Identity */}
            <div className="form-group checkbox-group">
              <label className="post-checkbox-label">
                <input
                  type="checkbox"
                  name="hideIdentity"
                  checked={formData.hideIdentity}
                  onChange={handleInputChange}
                />
                <span>Hide Identity</span>
              </label>
            </div>

            {/* Attached Images */}
            <div className="form-group">
              <label>Attached Images</label>
              <div className="images-section">
                {formData.attachedImages.map((image, index) => (
                  <div key={index} className="image-preview-container attached-image-preview">
                    <div className="image-preview-wrapper">
                      <img 
                        src={image.link} 
                        alt={image.name}
                        className="image-preview attached-image"
                        onClick={() => setModalImage(image.link)}
                        style={{ cursor: 'pointer' }}
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageRemove(index);
                        }}
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  </div>
                ))}
                <input
                  id="attachedImageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleAttachedImageAdd}
                  disabled={uploadingAttachedImage}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="attachedImageInput"
                  className="add-image-btn"
                  style={{ 
                    cursor: uploadingAttachedImage ? 'not-allowed' : 'pointer',
                    opacity: uploadingAttachedImage ? 0.6 : 1
                  }}
                >
                  <FontAwesomeIcon icon={faImage} style={{ marginRight: '0.5rem' }} />
                  {uploadingAttachedImage ? 'Uploading...' : 'Add Image'}
                </label>
              </div>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`message ${message.type}`}>
                <FontAwesomeIcon icon={message.type === 'success' ? faCheck : faTimes} />
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/posts')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div className="image-modal-overlay" onClick={() => setModalImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="image-modal-close"
              onClick={() => setModalImage(null)}
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={modalImage} alt="Full size preview" className="image-modal-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatePostPage;

