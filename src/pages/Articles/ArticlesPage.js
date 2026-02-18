import React, { useRef, useEffect, useState, useMemo } from 'react';
import axios from '../../public Func/axiosAuth';
import globalVar from '../../public Func/globalVar';
import { SearchBar, Select, LoadingSkeleton, Button } from '../../components/ui';
import ArticleBox from './components/Article';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePen } from '@fortawesome/free-solid-svg-icons';
import './Articles.css';

function ArticlesPage() {
  const [articleList, setArticleList] = useState([]);
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
        const res = await axios.get(globalVar.backendURL + '/blog/category-list');
        setCategoryList([
          { id: -1, name: 'All' },
          ...res.data.map(cat => ({
            ...cat,
            name: cat.en_category || cat.category || cat.mal_category || 'Unnamed Category'
          }))
        ]);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Reset when search params change
  useEffect(() => {
    setArticleList([]);
    setIncreaseLoadBlock(1);
    setIsAtEnd(true);
  }, [keyword, category]);

  // Fetch articles
  useEffect(() => {
    const fetchData = async () => {
      if (!isAtEnd) return;

      setLoading(true);

      try {
        const res = await axios.get(
          globalVar.backendURL +
            '/blog/article-feed-admin?loadBlock=' +
            loadBlock +
            '&effect=0' +
            (keyword ? '&searchText=' + keyword : '') +
            (Number(category) !== -1 && category ? '&categoryID=' + category : '')
        );

        const newArticleList = res.data.map((article) => (
          <ArticleBox id={article.id} key={article.id} article={article} />
        ));

        if (newArticleList.length > 0) {
          setArticleList(prevList => [...prevList, ...newArticleList]);
          setIncreaseLoadBlock(loadBlock + 1);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
        setIsAtEnd(false);
      }
    };

    fetchData();
  }, [isAtEnd, keyword, category, loadBlock]);

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

  return (
    <div className="articles-page" ref={divRef}>
      {/* Header */}
      <div className="articles-header">
        <div>
          <h1 className="page-title">Articles</h1>
          <p className="page-subtitle">
            {loading
              ? 'Loading...'
              : `${articleList.length} ${articleList.length === 1 ? 'article' : 'articles'} available`}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/articles/create')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FontAwesomeIcon icon={faFilePen} style={{ marginRight: '0.5rem' }} />
          Create Article
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="articles-search-section">
        <div className="articles-search-bar">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search articles..."
            size="lg"
            fullWidth
            disabled={loading}
          />
        </div>
        <div className="articles-filters">
          <Select
            value={activeCategory.toString()}
            onChange={(e) => setActiveCategory(e.target.value)}
            options={categoryOptions}
            placeholder="Select Category"
            size="lg"
            disabled={loading}
          />
          <button className="articles-search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="articles-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="article-skeleton">
              <LoadingSkeleton width="100%" height="200px" />
              <LoadingSkeleton width="80%" height="24px" style={{ marginTop: '16px' }} />
              <LoadingSkeleton width="60%" height="16px" style={{ marginTop: '8px' }} />
              <LoadingSkeleton width="100%" height="60px" style={{ marginTop: '12px' }} />
            </div>
          ))
        ) : articleList.length > 0 ? (
          <>
            {articleList}
            {loading && articleList.length > 0 && (
              <div className="articles-loading-more">
                <LoadingSkeleton width="100%" height="300px" />
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M14 2v6h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 13H8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17H8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 9H8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="empty-state-title">No articles found</h3>
            <p className="empty-state-description">
              {searchQuery || Number(activeCategory) !== -1
                ? 'Try adjusting your search criteria'
                : 'No articles available at the moment'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticlesPage;
