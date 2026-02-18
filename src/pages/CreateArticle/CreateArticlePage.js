import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faImage, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import globalVar from '../../public Func/globalVar';
import axios from '../../public Func/axiosAuth';
import { Button, Input, Card } from '../../components/ui';
import './CreateArticle.css';

function CreateArticlePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    categoryID: '',
    title: '',
    mainText: '',
    coverImage: '',
    coverImageFile: null,
    date: new Date().toISOString().split('T')[0],
    attachedImage: []
  });
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [uploadingAttachedImage, setUploadingAttachedImage] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(globalVar.backendURL + '/blog/category-list');
      const categoriesList = res.data || [];
      setCategories(categoriesList);
      if (categoriesList.length > 0) {
        setFormData(prev => ({ ...prev, categoryID: categoriesList[0].id.toString() }));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setMessage({ type: 'error', text: 'Failed to load categories. Please try again.' });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', text: '' });
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    try {
      setUploadingCoverImage(true);
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
      
      setFormData(prev => ({
        ...prev,
        coverImage: imageUrl,
        coverImageFile: file
      }));
      
      setMessage({ type: 'success', text: 'Cover image uploaded successfully!' });
    } catch (err) {
      console.error('Error uploading cover image:', err);
      setMessage({
        type: 'error',
        text: err.response?.data || 'Failed to upload cover image. Please try again.'
      });
    } finally {
      setUploadingCoverImage(false);
    }
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
        attachedImage: [...prev.attachedImage, { name: fileName, link: imageUrl }]
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
      attachedImage: prev.attachedImage.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.categoryID) {
      setMessage({ type: 'error', text: 'Please select a category.' });
      return false;
    }
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Please enter article title.' });
      return false;
    }
    if (!formData.mainText.trim()) {
      setMessage({ type: 'error', text: 'Please enter article content.' });
      return false;
    }
    if (formData.mainText.length > 1000) {
      setMessage({ type: 'error', text: 'Article content must be 1000 characters or less.' });
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
        categoryID: parseInt(formData.categoryID),
        title: formData.title.trim(),
        mainText: formData.mainText.trim(),
        coverImage: formData.coverImage.trim() || null,
        date: new Date(formData.date).toISOString(),
        attachedImage: formData.attachedImage.length > 0 ? formData.attachedImage : undefined
      };

      const res = await axios.post(
        globalVar.backendURL + '/admin/create-article',
        payload
      );

      // Backend returns {status: 200, data: "Done"} on success
      if (res.status === 200 && (res.data === 'Done' || res.data === 'done' || (res.data && res.data.done))) {
        setMessage({ type: 'success', text: 'Article created successfully!' });
        setTimeout(() => {
          navigate('/articles');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: res.data || 'Failed to create article. Please try again.' });
      }
    } catch (err) {
      console.error('Error creating article:', err);
      setMessage({
        type: 'error',
        text: err.response?.data || 'Failed to create article. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-article-page">
        <div className="loading-container">
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-article-page">
      <div className="create-article-container">
        {/* Header */}
        <div className="create-article-header">
          <button
            className="back-button"
            onClick={() => navigate('/articles')}
            aria-label="Go back"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1>Create New Article</h1>
        </div>

        {/* Form */}
        <Card className="create-article-card">
          <form onSubmit={handleSubmit}>
            {/* Category Selection */}
            <div className="form-group">
              <label htmlFor="categoryID">Category *</label>
              <select
                id="categoryID"
                name="categoryID"
                value={formData.categoryID}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.en_category || category.category || category.mal_category || 'Unnamed Category'}
                  </option>
                ))}
              </select>
            </div>

            {/* Article Title */}
            <div className="form-group">
              <label htmlFor="title">Article Title *</label>
              <Input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter article title..."
                maxLength={255}
              />
            </div>

            {/* Cover Image */}
            <div className="form-group">
              <label htmlFor="coverImage">Cover Image</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  id="coverImage"
                  name="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  disabled={uploadingCoverImage}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="coverImage"
                  className="add-image-btn"
                  style={{ 
                    cursor: uploadingCoverImage ? 'not-allowed' : 'pointer',
                    opacity: uploadingCoverImage ? 0.6 : 1
                  }}
                >
                  <FontAwesomeIcon icon={faImage} style={{ marginRight: '0.5rem' }} />
                  {uploadingCoverImage ? 'Uploading...' : formData.coverImage ? 'Change Cover Image' : 'Upload Cover Image'}
                </label>
                {formData.coverImage && (
                  <div className="image-preview-container">
                    <div className="image-preview-wrapper">
                      <img 
                        src={formData.coverImage} 
                        alt="Cover preview"
                        className="image-preview"
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => setFormData(prev => ({ ...prev, coverImage: '', coverImageFile: null }))}
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Article Content */}
            <div className="form-group">
              <label htmlFor="mainText">Article Content *</label>
              <textarea
                id="mainText"
                name="mainText"
                value={formData.mainText}
                onChange={handleInputChange}
                rows={12}
                maxLength={1000}
                required
                className="form-textarea"
                placeholder="Write your article content here..."
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

            {/* Attached Images */}
            <div className="form-group">
              <label>Attached Images</label>
              <div className="images-section">
                {formData.attachedImage.map((image, index) => (
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
                onClick={() => navigate('/articles')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Article'}
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

export default CreateArticlePage;

