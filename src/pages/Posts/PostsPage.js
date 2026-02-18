import React, { useRef, useEffect, useState, useMemo } from 'react';
import axios from '../../public Func/axiosAuth';
import globalVar from '../../public Func/globalVar';
import { SearchBar, Select, LoadingSkeleton, Button } from '../../components/ui';
import PostBox from './components/Post';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import './Posts.css';

function PostsPage() {
  const [postList, setPostList] = useState([]);
  const [isAtEnd, setIsAtEnd] = useState(true);
  const [loadBlock, setIncreaseLoadBlock] = useState(1);
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  let [searchParams, setSearchParams] = useSearchParams();
  let keyword = searchParams.get('keyword');
  let category = searchParams.get('category');
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(keyword || '');
  const [activeCategory, setActiveCategory] = useState(category ? category : -1);
  const divRef = useRef(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(globalVar.backendURL + '/community/community-list');
        setCategoryList([
          { id: -1, name: 'All' },
          ...res.data
        ]);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchData = async () => {
      if (!isAtEnd) return;

      setLoading(true);

      try {
        const res = await axios.get(
          globalVar.backendURL +
            '/community/post-feed-admin?loadBlock=' +
            loadBlock +
            '&effect=0' +
            (keyword ? '&searchText=' + keyword : '') +
            (Number(category) !== -1 && category ? '&communityID=' + category : '')
        );

        const newPostList = res.data.map((post) => (
          <PostBox id={post.id} key={post.id} post={post} />
        ));

        if (newPostList.length > 0) {
          setPostList([...postList, ...newPostList]);
          setIncreaseLoadBlock(loadBlock + 1);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
        setIsAtEnd(false);
      }
    };

    fetchData();
  }, [isAtEnd]);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!divRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = divRef.current;
      if (scrollHeight - scrollTop === clientHeight) {
        setIsAtEnd(true);
      }
    };

    const divElement = divRef.current;
    if (divElement) {
      divElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (divElement) {
        divElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Handle search
  const handleSearch = () => {
    const params = {};
    if (searchQuery) params.keyword = searchQuery;
    if (Number(activeCategory) !== -1) params.category = activeCategory;

    setSearchParams(params);
    window.location.reload();
  };

  // Category options for Select
  const categoryOptions = useMemo(() => {
    return categoryList.map(cat => ({
      value: cat.id.toString(),
      label: cat.name
    }));
  }, [categoryList]);

  // Get active category name
  const activeCategoryName = useMemo(() => {
    const cat = categoryList.find(c => c.id.toString() === activeCategory.toString());
    return cat ? cat.name : 'All';
  }, [categoryList, activeCategory]);

  return (
    <div className="posts-page" ref={divRef}>
      {/* Header */}
      <div className="posts-header">
        <div>
          <h1 className="page-title">Community Posts</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `Viewing ${postList.length} ${postList.length === 1 ? 'post' : 'posts'}`}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/posts/create')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FontAwesomeIcon icon={faPlus} style={{ marginRight: '0.5rem' }} />
          Create Post
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="posts-search-section">
        <div className="posts-search-bar">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by keyword..."
            size="lg"
            fullWidth
            disabled={loading}
          />
        </div>
        <div className="posts-filters">
          <Select
            value={activeCategory.toString()}
            onChange={(e) => setActiveCategory(e.target.value)}
            options={categoryOptions}
            placeholder="Select Community"
            size="lg"
            disabled={loading}
          />
          <button className="posts-search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="posts-feed">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="post-skeleton">
              <LoadingSkeleton width="100%" height="200px" />
              <LoadingSkeleton width="80%" height="24px" style={{ marginTop: '16px' }} />
              <LoadingSkeleton width="60%" height="16px" style={{ marginTop: '8px' }} />
            </div>
          ))
        ) : postList.length > 0 ? (
          <>
            {postList}
            {loading && postList.length > 0 && (
              <div className="posts-loading-more">
                <LoadingSkeleton width="100%" height="150px" />
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="empty-state-title">No posts found</h3>
            <p className="empty-state-description">
              {searchQuery || Number(activeCategory) !== -1
                ? 'Try adjusting your search criteria'
                : 'No posts available at the moment'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostsPage;
