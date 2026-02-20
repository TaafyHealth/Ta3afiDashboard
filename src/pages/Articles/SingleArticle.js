import React, { useRef, useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import './SingleArticle.css';
import ArticleBox from './components/Article';
// import randomizeData from '../../public Func/RandomData';
import axios from '../../public Func/axiosAuth';
import globalVar from '../../public Func/globalVar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import formatDate from '../../public Func/DateFix';
import ArticleCommentBox from './components/ArticleComment';


function SingleArticlesPage() {
    const {articleID} = useParams()
    const navigate = useNavigate()

    const [article,setArticleList] = useState({})
    const [isAtEnd, setIsAtEnd] = useState(true);
    const [loadingStatus,setLoadingStatus] = useState('shown')
    const divRef = useRef(null);
    const [RateColor,setRateColor] = useState("rateGreen")
    const [UserImage,setUserImage] = useState("")
    const [imageList,setImageList] = useState([])

    // Get current logged-in supervisor/admin ID
    const currentUserId = localStorage.getItem('id') || localStorage.getItem('supervisorID') || localStorage.getItem('supervisor_id');
    const currentRole = localStorage.getItem('role');
    const isCurrentUserSupervisor = currentRole === 'supervisor' || currentRole === 'Supervisor' || currentRole === 'super';
    
    // Check if this is supervisor's own article (recalculated when article changes)
    // Simplified: if user is supervisor and article is by supervisor, show delete button
    const isOwnArticle = useMemo(() => {
        if (!article || !article.id) return false;
        // Show delete if user is supervisor and article is by supervisor
        if (isCurrentUserSupervisor && article.isSupervisor) {
            return true;
        }
        return false;
    }, [article, isCurrentUserSupervisor]);

    // Comments
    var [SeeCommentButton,setButtonText] = useState("See Comments")
    var [CommentButtenState,SetButtonState] = useState("enabled")
    const [commentList,setCommentList] = useState([]) 
    const [loadBlock,IncreaseLoadBlock] = useState(1) 


    //// Report Part
    const [somthingElse,setsomthingElse] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [selectedReason, setSelectedReason] = useState(null)
    const [showErrorMessage,setshowErrorMessage] = useState(null)

    // Delete Article Part
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    function showDeleteConfirm(){
        setShowDeleteModal(true)
    }

    function hideDeleteModal(){
        setShowDeleteModal(false)
    }

    async function deleteArticle(){
        setIsDeleting(true)
        try{
            const res = await axios.delete(globalVar.backendURL + '/admin/article', {
                data: { articleID: article.id }
            })
            
            if(res.status === 200 && (res.data === 'Done' || res.data?.message === 'Done' || res.data?.done)){
                hideDeleteModal()
                // Redirect to articles page after successful deletion
                navigate('/articles')
            } else {
                setshowErrorMessage('Failed to delete article. Please try again.')
            }
        } catch(err){
            console.error('Error deleting article:', err)
            setshowErrorMessage(err.response?.data || 'Failed to delete article. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }
    
    // Hiding the Popup Window
    function hideReportForm(){
        setShowReportModal(false)
        setTimeout(() => {
            setsomthingElse(false)
            setshowErrorMessage(null)
            setSelectedReason(null)
        }, 300)
    }

    // Showing the Popup Window
    function ShowPopupReportForm(){
        setShowReportModal(true)
        setsomthingElse(false)
        setshowErrorMessage(null)
        setSelectedReason(null)
    }

    // Choose a Reason
    function SelectReportReason(event){
        const reason = event.currentTarget.innerHTML
        setSelectedReason(reason)
        if(reason === 'Somthing Else'){
            setsomthingElse(true)
        }else{
            setsomthingElse(false)
        }
    }   
    async function submitReportForm(event){
        var reason = ''
        // Data Reading and Validation
        if (selectedReason === null){
            setshowErrorMessage('You Have To Choose a Reason')
            return;
        }
        reason = selectedReason
        if (selectedReason === 'Somthing Else'){
            const inputValue = event.currentTarget.parentElement.querySelector("input").value
            if (inputValue ==''){
                setshowErrorMessage('You Have To Write a Reason')
                return
            }
            reason = inputValue
        }
        setshowErrorMessage(null)
        try{
            hideReportForm()
            
            axios.delete(globalVar.backendURL+"/super/article",{data:{articleID:article.id,reason:reason}}).then((res)=>{
                window.location.href = '/articles';
            }).catch((err)=>{
                console.log("Error!!\n",err)
            })
        }catch(err){
            console.log("Error!!\n",err)
        }

    }
    // Sending To Get The Article
    useEffect(() => {
        const fetchData = async () => {
        try {
            const res = await axios.get(
            globalVar.backendURL +
                "/blog/article?" +
                `articleID=${articleID}`

            );
            setArticleList(res.data)
            
            // Validate For anonymous
            setUserImage(<img src={res.data.doctorProfileImage} alt={res.data.doctorName + " Profile Pic"}/>)
            
            // Uploaded Images
            const images = []
            for(var i of res.data.images){
                images.push(<img src={globalVar.backendURL+"/file/"+i.link} alt="Article content"/>)
            }
            setImageList(images)

            // AI Rating Colors
            if (Number(res.data.AI_saftyRate)<50){
                setRateColor("rateRed")
            }else if (Number(res.data.AI_saftyRate)<75){
                setRateColor("rateYellow")
            } else {
                setRateColor("rateGreen")
            }
            setLoadingStatus("disabled")
        
            // Comments
            if (res.data.commentsNumber ==0){
                setButtonText("No Comments on This Article")
                SetButtonState("disabled")
            }

        } catch (err) {
            console.error("Error fetching article:", err);
        }
        };
    
        fetchData();
    
        // Cleanup function to handle potential cancellation or cleanup tasks
        return () => {};
    }, [articleID]);


    // Load a Comment according to the Current LoadBlock
    async function loadComments(event){
        if(event.currentTarget.classList.contains("disabled")){
            return;
        }
        setButtonText("Loading ...")
        try{
            const res  = await axios.get(globalVar.backendURL+"/blog/comment-list?loadBlock="+loadBlock+"&articleID="+articleID)
            
            const TempCommentList = commentList
            for(var comment of res.data){
                TempCommentList.push(<ArticleCommentBox commentData = {comment}/>)
            }
            setCommentList(TempCommentList)
            IncreaseLoadBlock(loadBlock+1)
            setButtonText("See More Comments")
            if(res.data.length <2 || commentList.length >= article.commentsNumber){
                setButtonText("No More Comments")
                SetButtonState("disabled")
            }
        


        }catch(err){
            console.log("Error!!")
            console.log(err)
            setButtonText("See Comments")
        }
    }
    useEffect(()=>{

    })
    return (
        <div className='single-article-page'>
            <div className='SingleArticleBox'>
                <div className='ArticleHeader'>
                    <div className='left'>
                        <span className='starRate' title={`${article.doctorName} Star Rating`}>
                            <FontAwesomeIcon icon="fa-solid fa-star" /> {article.doctorStarRate}
                        </span>
                        <span title={`The Number of Session ${article.doctorName} Had`}>
                            <FontAwesomeIcon icon="fa-solid fa-calendar-check" /> {article.doctorSessionNumber}
                        </span>
                        <span className={'aiRate ' + RateColor} title="AI Safety Rating">
                            <FontAwesomeIcon icon="fa-solid fa-robot" /> {article.AI_saftyRate}% - ({article.AI_saftyWord})
                        </span>
                    </div>
                    <div className='center'>
                        {UserImage}
                        <div className='AutherInfo'>
                            <p>{article.doctorName}</p>
                            <p>{article.doctorTitle}</p>
                            <p className='date'>{formatDate(article.date)}</p>
                        </div>
                    </div>
                    <div className='right'>
                        <div className='Tags'>
                            <span className='Community'>{article.category}</span>
                            {/* Show Delete button for admin's own articles or supervisor's own articles */}
                            {/* Check multiple conditions: isAdmin, adminEmail, isSupervisor flag, or supervisorID exists */}
                            {((article.isAdmin || article.adminEmail) || 
                              (isCurrentUserSupervisor && (article.isSupervisor || article.supervisorID))) && (
                                <span className={'Delete' + (isDeleting ? ' disabled' : '')} onClick={showDeleteConfirm} style={{pointerEvents: isDeleting ? 'none' : 'auto'}}>
                                    <FontAwesomeIcon icon={faTrash} style={{ marginRight: '0.25rem' }} />
                                    Delete
                                </span>
                            )}
                            {/* Show Report button only if it's not the supervisor's own article and not admin's article */}
                            {!(isCurrentUserSupervisor && (article.isSupervisor || article.supervisorID)) && !(article.isAdmin || article.adminEmail) && (
                            <span className='Report' onClick={ShowPopupReportForm}>Report</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className='ArticleBody'>
                    {article.covorImage?<div className='CoverImage'>
                        <img src={globalVar.backendURL+"/file/"+article.covorImage} alt="Article Cover"/>
                    </div>:''}
                    <div className='ArticleText'>
                        <h1>{article.title}</h1>
                        <p>{article.mainText}</p>
                    </div>
                    <div className='ArticleImages'>
                        {imageList}
                    </div>
                </div>
                <div className='Reactions'>
                    <div className='left'>
                        <span title='How Many Times the Article Was Displayed on a Screen'>
                            <FontAwesomeIcon icon="fa-solid fa-eye" /> {article.views}
                        </span>
                    </div>
                    <div className='right'>
                        <span title='How Many People Reacted To This Article (Doctors and Patients)'>
                            <FontAwesomeIcon icon="fa-solid fa-heart" /> {Number(article.upVotes) || 0 + Number(article.DoctorUpVotes) || 0}
                        </span>
                        <span title='Total Comment Number'>
                            <FontAwesomeIcon icon="fa-solid fa-comment" /> {article.commentsNumber}
                        </span>
                    </div>
                </div>
                <div className='Comments'>
                    <div className='CommentsBox'>
                        {commentList}
                    </div>
                    <div className={'CommentsButton '+CommentButtenState} onClick={loadComments}>
                        {SeeCommentButton}
                    </div>
                </div>
            </div>

            {showReportModal && ReactDOM.createPortal(
                <div className='ReportPopupWindow'>
                    <div className='backgroundBlock' onClick={hideReportForm}></div>
                    <div className='ReportForm'>
                        <h1 className='TitleReport'>Report</h1>
                        <h3 className='ForNextArticle'>The Article:</h3>
                        <p className='ReportMainArticleText'>{article.title}</p>
                        <div className='ReportTagOptions'>
                            <span className={'ReportTag' + (selectedReason === 'Spam' ? ' selected' : '')} onClick={SelectReportReason}>Spam</span>
                            <span className={'ReportTag' + (selectedReason === 'Nudity' ? ' selected' : '')} onClick={SelectReportReason}>Nudity</span>
                            <span className={'ReportTag' + (selectedReason === 'Scam' ? ' selected' : '')} onClick={SelectReportReason}>Scam</span>
                            <span className={'ReportTag' + (selectedReason === 'Illigal' ? ' selected' : '')} onClick={SelectReportReason}>Illigal</span>
                            <span className={'ReportTag' + (selectedReason === 'Sucide or Self-injury' ? ' selected' : '')} onClick={SelectReportReason}>Sucide or Self-injury</span>
                            <span className={'ReportTag' + (selectedReason === 'Violance' ? ' selected' : '')} onClick={SelectReportReason}>Violance</span>
                            <span className={'ReportTag' + (selectedReason === 'Hate Speech' ? ' selected' : '')} onClick={SelectReportReason}>Hate Speech</span>
                            <span className={'ReportTag' + (selectedReason === 'Somthing Else' ? ' selected' : '')} onClick={SelectReportReason}>Somthing Else</span>
                        </div>
                        <div className={'ReasonInputForm'+(somthingElse?" show":"")}>
                            <h2>Reason:</h2>
                            <p>Write a Simple Message For the Report Reason</p>
                            <input type='text' placeholder='Write the Message'/>
                        </div>
                        <button className='submutReportButton' onClick={submitReportForm}>Submit Report</button>
                        <p className={'ErrorMessage'+(showErrorMessage?" show":"")}>{showErrorMessage}</p>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && ReactDOM.createPortal(
                <div className='ReportPopupWindow'>
                    <div className='backgroundBlock' onClick={hideDeleteModal}></div>
                    <div className='ReportForm'>
                        <h1 className='TitleReport'>Delete Article</h1>
                        <h3 className='ForNextArticle'>Are you sure you want to delete this article?</h3>
                        <p className='ReportMainArticleText'>{article.title}</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button className='submutReportButton' onClick={hideDeleteModal} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}>
                                Cancel
                            </button>
                            <button className='submutReportButton' onClick={deleteArticle} disabled={isDeleting} style={{ background: 'var(--danger-500)', flex: 1 }}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                        {showErrorMessage && (
                            <p className={'ErrorMessage show'}>{showErrorMessage}</p>
                        )}
                    </div>
                </div>,
                document.body
            )}

            
        </div>
    );
}

export default SingleArticlesPage;
